// Copyright 2019 The FairDataSociety Authors
// This file is part of the FairDataSociety library.
//
// The FairDataSociety library is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// The FairDataSociety library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with the FairDataSociety library. If not, see <http://www.gnu.org/licenses/>.

import React, { Component } from 'react';
import { withRouter } from "react-router";
import PropTypes from "prop-types";

import Utils from '../services/Utils';

import UnlockMailbox from './Shared/UnlockMailbox'
import AddMailbox from './Shared/AddMailbox'

import Moment from 'moment';

import * as Sentry from '@sentry/browser';

class Mailbox extends Component{

  getInitialState(){

    this.FDS = this.props.FDS;
    let mailboxes = this.FDS.GetAccounts();

    if(this.props.selectedMailbox){

        return {
          unlockingMailbox: null,
          uiState: 1,
          shownMessages: [],

          isAddingMailbox: false,
          isUnlockingMailbox: false,
          mailboxes: mailboxes,
          activeMailboxSubDomain: this.props.selectedMailbox.subdomain,
          dropDownValue: false,
          mailboxesExist: true,
          checkingAvailability: false,
          feedbackMessage: '',
          mailboxName: false,
          passwordsValid: false,
          processingAddMailbox: false,
          hasErrored: false,
          isLoadingMessages: false,
          debounceUpdate: 0
        };
    }else
    if(mailboxes.length === 0){
      return {
        unlockingMailbox: null,
        uiState: 0,
        shownMessages: [],

        isAddingMailbox: true,
        isUnlockingMailbox: false,
        mailboxes: mailboxes,
        activeMailboxSubDomain: false,
        dropDownValue: false,
        mailboxesExist: false,
        checkingAvailability: false,
        feedbackMessage: '',
        mailboxName: false,
        passwordsValid: false,
        processingAddMailbox: false,
        hasErrored: false,
        isLoadingMessages: false,
        debounceUpdate: 0
      };
    }else
    if(mailboxes.length > 0){
      return {
        uiState: 0,
        shownMessages: [],

        isAddingMailbox: false,
        isUnlockingMailbox: true,
        mailboxes: mailboxes,
        unlockingMailbox: mailboxes[0].subdomain,
        activeMailboxSubDomain: false,
        dropDownValue: mailboxes[0].subdomain,
        mailboxesExist: true,
        checkingAvailability: false,
        feedbackMessage: '',
        mailboxName: false,
        passwordsValid: false,
        processingAddMailbox: false,
        hasErrored: false,
        isLoadingMessages: false,
        debounceUpdate: 0
      };
    }
  }

  resetToInitialState(){
    this.setState(this.getInitialState());
  }

  constructor(props) {
    super(props);

    this.handleSelectMailbox = this.handleSelectMailbox.bind(this);
    this.showReceived = this.showReceived.bind(this);
    this.showSent = this.showSent.bind(this);
    this.showStored = this.showStored.bind(this);
    this.showConsents = this.showConsents.bind(this);

    this.state = this.getInitialState();

  }

  componentDidUpdate(prevProps) {
    let prevLoc = prevProps.routerArgs.location.pathname;
    let newLoc = this.props.routerArgs.location.pathname;
    let messageType = this.props.routerArgs.match.params.filter;
    if(
        (
          prevLoc !== newLoc ||
          (messageType !== undefined && this.state.shownMessageType !== messageType)
        ) && (
          this.debounceUpdate === undefined ||
          this.debounceUpdate + 100 < Date.now()
        )
      )
    {
      this.debounceUpdate = Date.now();
      if(this.props.selectedMailbox){
        switch(messageType){
          case 'sent':
            this.showSent();
          break;
          case 'stored':
            this.showStored();
          break;
          case 'consents':
            this.showConsents();
          break;
          default:
            this.showReceived();
          break;
        }
      }
    }
  }


  componentWillUnmount(){
    clearInterval(this.state.checkreceivedInterval);
  }

  updatePinState(hash, state){
    let newShownMessages = this.state.shownMessages.map((h)=>{
      if(h.address === hash){
        h.meta.pinned = state;
        return h;
      }else{
        return h;
      }
    });
    this.setState({shownMessages: newShownMessages});
  }

  pin(hash, state=true){
    this.updatePinState(hash, state);
    this.props.setIsLoading(true); //reset then unset by showStored()
    let fdsPin = this.props.fdsPin;
    if(state === true){
      return fdsPin.pin(hash).then(()=>{
        return this.props.selectedMailbox.updateStoredMeta(hash, {pinned: true}).then(()=>{
          this.props.setIsLoading(false);
          setTimeout(this.props.updateStoredStats, 1000);
        });
      }).catch(()=>{
        this.updatePinState(hash, !state);
      })
    }else{
      return fdsPin.unpin(hash).then(()=>{
        return this.props.selectedMailbox.updateStoredMeta(hash, {pinned: false}).then(()=>{
          this.props.setIsLoading(false);
          setTimeout(this.props.updateStoredStats, 1000);
        });
      }).catch(()=>{
        this.updatePinState(hash, !state);
      });
    }
  }

  handleSelectMailbox(option){
    if(option.value === 'new-mailbox'){
      this.addMailbox();
    }else{
      this.setUnlockingMailbox(option.value);
    }
  }

  setUnlockingMailbox(subdomain){
    this.setState({
      unlockingMailbox: subdomain,
      isUnlockingMailbox: true,
      isAddingMailbox: false,
      dropDownValue: subdomain
    });
  }

  setSelectedMailbox(account){
    this.props.setSelectedMailbox(account);
    this.props.handleNavigateTo('/mailbox/received');
  }

  showSent(){
    this.props.setIsLoading(true);
    this.setState({isLoadingMessages: true});
    this.FDS.currentAccount.messages('sent').then((messages)=>{
      this.setState({
        shownMessageType: 'sent',
        shownMessages: messages.reverse()
      });
      this.props.setIsLoading(false);
      this.setState({isLoadingMessages: false});
    });
  }

  showReceived(e, force = true){
    this.props.setIsLoading(true);
    this.setState({isLoadingMessages: true});
    if(force === true || this.state.shownMessageType === 'received'){
      this.FDS.currentAccount.messages('received', '/shared/fairdrop/encrypted').then((messages)=>{
        localStorage.setItem(`fairdrop_receivedSeenCount_${this.FDS.currentAccount.subdomain}`, messages.length);

        this.setState({
          shownMessageType: 'received',
          shownMessages: messages.reverse(),
          receivedUnseenCount: 0
        });
        this.props.setIsLoading(false);
        this.setState({isLoadingMessages: false});
      });
    }
  }

  showStored(){
    this.props.setIsLoading(true);
    this.setState({isLoadingMessages: true});
    return this.FDS.currentAccount.stored().then((messages)=>{
      if(typeof messages === 'undefined'){
        messages = [];
      }
      this.setState({
        shownMessageType: 'stored',
        shownMessages: messages.reverse()
      });
      this.props.setIsLoading(false);
      this.setState({isLoadingMessages: false});
    });
  }

  showConsents(){
    this.props.setIsLoading(true);
    this.setState({isLoadingMessages: true});
    this.FDS.currentAccount.messages('received', '/shared/consents').then((messages)=>{
      this.setState({
        shownMessageType: 'consents',
        shownMessages: messages.reverse()
      });
      this.props.setIsLoading(false);
      this.setState({isLoadingMessages: false});
    });
  }

  retrieveSentFile(message){
    message.saveAs();
  }

  retrieveStoredFile(file){
    file.saveAs();
  }

  mailboxUnlocked(){
    this.setState({
      uiState: 1,
      shownMessageType: 'received',
      isLoadingMessages: true,
    });
    return this.showReceived();
  }

  getDropDownOptions(){
    return this.state.mailboxes.map((m)=>{
      return {label: m.subdomain, value:  m.subdomain};
    }).concat({label: 'new mailbox +', value: "new-mailbox" });
  }

  addMailbox(){
    this.setState({
      isAddingMailbox: true,
      isUnlockingMailbox: false
    });
  }

  unlockMailbox(e){
    this.props.setIsLoading(true);
    let subdomain = this.state.unlockingMailbox;
    let password = this.state.password;

    this.FDS.UnlockAccount(subdomain, password).then((account)=>{
      if(window.Sentry){
        window.Sentry.configureScope((scope) => {
          scope.setUser({"username": account.subdomain});
        });
      }
      this.setState({
        feedbackMessage: 'Mailbox unlocked.',
        mailboxIsUnlocked: true,
      });
      this.mailboxUnlocked()
      return this.setSelectedMailbox(this.FDS.currentAccount);
    }).catch((error)=>{
      this.props.setIsLoading(false);      
      this.setState({
        feedbackMessage: 'Password invalid, please try again.',
        mailboxIsUnlocked: false
      });
    })
  }

  handleAddMailbox(e){
    e.preventDefault();

    if(this.state.mailboxName === false){
      this.processMailboxName();
      return false;
    }
    if(this.state.passwordsValid === false){
      this.processMailboxPassword();
      return false;
    }

    this.setState({processingAddMailbox: true});

    // Enable navigation prompt
    window.onbeforeunload = function() {
        return true;
    };

    this.FDS.CreateAccount(this.state.mailboxName, this.state.password, (message) => {
      this.setState({feedbackMessage: message});
    }).then((account)=>{
      this.FDS.UnlockAccount(this.state.mailboxName, this.state.password).then((account)=>{
        if(window.Sentry){
          window.Sentry.configureScope((scope) => {
            scope.setUser({"username": this.state.mailboxName});
          });
        }
        this.setState({
          feedbackMessage: 'Mailbox unlocked.',
          mailboxIsUnlocked: true,
        });
        // Remove navigation prompt
        window.onbeforeunload = null;        
        this.mailboxUnlocked();
        this.setSelectedMailbox(this.FDS.currentAccount);
        return account;
      }).then(async (account)=>{
        this.setState({feedbackMessage: "Creating warrant"});
        let balance = await account.getBalance();
        let warrantBalance = Math.floor(balance*80/100);
        let fdsPin = this.props.fdsPin;
        let wa = await fdsPin.createWarrant(warrantBalance);
        this.props.updateBalance();
        // console.log(wa);
        // let wb = await fdsPin.getMyBalance();
        // console.log(wb)
        return account;  
        })
    }).catch((error)=>{
      if(window.Sentry) window.Sentry.captureException(error);
      this.setState(
        {
          feedbackMessage: `${error.toString()} - please try again.`,
          hasErrored: true,
          processingAddMailbox: false
        });
    });

  }

  cancelAddMailbox(){
    this.setState({
      isAddingMailbox: false,
      isUnlockingMailbox: true,
      feedbackMessage: ''
    });
  }

  handleInputMailboxName(e){
    e.preventDefault();
    let mailboxName = e.target.value.toLowerCase();
    this.setState({
      mailboxName: mailboxName,
    });
    //check to see if mailbox name is unused/valid
    if(this.state.checkingAvailability === false){
      this.processMailboxName(mailboxName).catch((error)=>{
        //already handled
      });
    }
  }

  processMailboxName(mailboxName){
    this.setState({
      checkingAvailability: true,
      feedbackMessage: "Checking availability..."
    });

    return new Promise((resolve, reject)=>{
      // is mailbox name valid, available
      if(mailboxName && this.FDS.Account.isMailboxNameValid(mailboxName)){
        return this.FDS.Account.isMailboxNameAvailable(mailboxName).then((result) => {
          if(result === true){
            this.setState({
              checkingAvailability: false,
              feedbackMessage: "Name available!"
            });
            resolve(true);
          }else{
            this.setState({
              mailboxName: false,
              checkingAvailability: false,
              feedbackMessage: "Sorry, that name is not available!"
            });
            resolve(false);
          }
        }).catch((error)=>{
          if(error.toString() === 'Error: Invalid JSON RPC response: ""'){
            this.setState({
              mailboxName: false,
              checkingAvailability: false,
              feedbackMessage: "Network error - try again!"
            });
            resolve(false);
          }
        });
      }else{
        this.setState({
          mailboxName: false,
          checkingAvailability: false,
          feedbackMessage: "Sorry, that name is invalid."
        });
        resolve(false);
      }
    });
  }

  handleInputPassword(e){
    e.preventDefault();
    this.setState({password: e.target.value}, this.processMailboxPassword);
  }

  handleInputPasswordVerification(e){
    e.preventDefault();
    this.setState({passwordVerification: e.target.value}, this.processMailboxPassword);
  }

  processMailboxPassword(){
    let password = this.state.password;
    let passwordVerification = this.state.passwordVerification;

    if(password === ""){
      this.setState({
        feedbackMessage: 'You must enter a password.',
        passwordsValid: false
        // password: false
      });
      return false;
    }

    if(this.state.isUnlockingMailbox === true){
      return true;
    }

    if(password !== passwordVerification){
      this.setState({
        feedbackMessage: 'Passwords must match.',
        passwordsValid: false
        // password: false
      });
      return false
    }

    if(password === passwordVerification){
      this.setState({
        feedbackMessage: 'Passwords match!',
        // password: password
        passwordsValid: true
      });
      return true
    }
  }

  render() {
    return (
      <div>
        <div id="select-mailbox" className={"select-mailbox white page-wrapper " + (this.state.uiState === 0 ? "fade-in" : "hidden")}>
          <div className="select-mailbox-ui page-inner-centered">
            <div className="mist"></div>
            <div className="page-inner-wrapper">
              {this.state.isUnlockingMailbox &&
                <div className="unlock-mailbox">
                    <h1 className="select-account-header">Log In / Register</h1>
                    <UnlockMailbox
                      dropDownOptions={this.getDropDownOptions()}
                      dropDownValue={this.state.unlockingMailbox}
                      handleSelectMailbox={this.handleSelectMailbox}
                      handleInputPassword={this.handleInputPassword.bind(this)}
                      unlockMailbox={this.unlockMailbox.bind(this)}
                    />
                </div>
              }
              {this.state.isAddingMailbox &&
                <div className="select-mailbox">
                    <h1 className="select-account-header">Log In / Register</h1>
                      <AddMailbox
                        handleInputMailboxName={this.handleInputMailboxName.bind(this)}
                        handleInputPassword={this.handleInputPassword.bind(this)}
                        handleInputPasswordVerification={this.handleInputPasswordVerification.bind(this)}
                        handleAddMailbox={this.handleAddMailbox.bind(this)}
                        disabled={this.state.processingAddMailbox}                        
                      />
                </div>
              }
              <div className="ui-feedback">{this.state.feedbackMessage}</div>
              {this.state.isAddingMailbox &&
                <div className="actions btn-grp">
                  <button 
                    className="btn btn-lg btn-green btn-float-left" 
                    onClick={this.handleAddMailbox.bind(this)}
                    disabled={this.state.processingAddMailbox}
                  >
                    Add Mailbox
                  </button>
                  {this.state.mailboxesExist &&
                    <button className="btn btn-sm btn-black btn-link btn-float-right" onClick={this.cancelAddMailbox.bind(this)}><img src={this.props.appRoot + "/assets/images/x-black.svg"} alt="cancel" />Cancel</button>              
                  }
                </div>
              }
              {this.state.isUnlockingMailbox &&
                <div className="actions btn-grp">
                  <button className="btn btn-lg btn-green btn-float-left" onClick={this.unlockMailbox.bind(this)}>Unlock Mailbox</button>
                </div>
              }
            </div>
          </div>
        </div>
        <div id="show-files" className={"show-files page-wrapper " + (this.state.uiState === 1 ? "fade-in" : "hidden")}>
          <div className="page-inner-centered">
            <div className="show-files-ui">
              <div className="inbox clearfix">
                <div className="inbox-nav hide-mobile">
                  <table>
                    <tbody>
                      <tr>
                        <td><button onClick={this.props.handleSendFile}>Send<img alt="tick" className="inbox-tick" src={this.props.appRoot + "/assets/images/arrow.svg"}/></button></td>
                      </tr>
                      <tr>
                        <td><button onClick={this.props.handleStoreFile}>Store<img alt="tick" className="inbox-tick" src={this.props.appRoot + "/assets/images/arrow.svg"}/></button></td>
                      </tr>
                      <tr>
                        <td><button onClick={this.props.handleQuickFile}>Publish<img alt="tick" className="inbox-tick" src={this.props.appRoot + "/assets/images/arrow.svg"}/></button></td>
                      </tr>  
                      <tr>
                        <td><button className={this.state.shownMessageType !== 'received' ? "inactive" : ""} onClick={()=>{this.props.handleNavigateTo('/mailbox/received')}}><img alt="tick" className="inbox-tick" src={this.props.appRoot + "/assets/images/tick.svg"}/>Received</button></td>
                      </tr>
                      <tr>
                        <td><button className={this.state.shownMessageType !== "sent" ? "inactive" : ""} onClick={()=>{this.props.handleNavigateTo('/mailbox/sent')}}><img alt="arrow" className="inbox-arrow" src={this.props.appRoot + "/assets/images/arrow.svg"}/>Sent</button></td>
                      </tr>
                      <tr>
                        <td><button className={this.state.shownMessageType !== "stored" ? "inactive" : ""} onClick={()=>{this.props.handleNavigateTo('/mailbox/stored')}}><img alt="paperclip" className="inbox-paperclip" src={this.props.appRoot + "/assets/images/paperclip.svg"}/>Stored</button></td>
                      </tr>
                      <tr id="consents-row" className="consents-hidden">
                        <td><button className={this.state.shownMessageType !== "consents" ? "inactive" : ""} onClick={()=>{this.props.handleNavigateTo('/mailbox/consents')}}><img alt="tick" className="inbox-tick" src={this.props.appRoot + "/assets/images/tick.svg"}/>Consents</button></td>
                      </tr>               
                    </tbody>
                  </table>
                </div>
                <div className="mobile-inbox-nav show-mobile">
                    <div className="mobile-inbox-nav-cell"><button className={(this.state.shownMessageType !== 'received' ? "inactive" : "")} onClick={this.showReceived}><img alt="tick" className="inbox-tick" src={this.props.appRoot + "/assets/images/tick.svg"}/></button></div>
                    <div className="mobile-inbox-nav-cell"><button className={(this.state.shownMessageType !== "sent" ? "inactive" : "")} onClick={this.showSent}><img alt="arrow" className="inbox-arrow" src={this.props.appRoot + "/assets/images/arrow.svg"}/></button></div>
                    <div className="mobile-inbox-nav-cell"><button className={(this.state.shownMessageType !== "stored" ? "inactive" : "")} onClick={this.showStored}><img alt="paperclip" className="inbox-paperclip" src={this.props.appRoot + "/assets/images/paperclip.svg"}/></button></div>
                </div>
                <div className="inbox-header">
                  <table>
                    <thead>
                      <tr>
                        <th className="inbox-col inbox-col-name">Name</th>
                        <th className="inbox-col inbox-col-time hide-mobile">
                          {(() => {
                            switch(this.state.shownMessageType) {                              
                              case 'stored':
                                return <img src={this.props.appRoot + "/assets/images/thumbtack-solid.svg"} alt="Pin" className="inbox-pin"/>;
                              default:
                                return;
                            }
                          })()}
                        </th>
                        <th className="inbox-col inbox-col-name">
                          {(() => {
                            switch(this.state.shownMessageType) {
                              case 'sent':
                                return "To";
                              case 'received':
                                return "From";
                              case 'consents':
                                return "From";                                
                              case 'stored':
                                return "";
                              default:
                                return;
                            }
                          })()}
                        </th>
                        <th className="inbox-col inbox-col-time hide-mobile">Time</th>
                        <th className="inbox-col inbox-col-time">Size</th>
                      </tr>
                    </thead>
                  </table>
                </div>
                <div className="inbox-main">
                  <table>
                    <tbody>
                      {(() => {
                        if(this.state.isLoadingMessages === true){
                          return <tr className={
                                        "message-list last"
                                      }>
                                      <td>Loading...</td>
                                    </tr>
                        }
                        if(this.state.shownMessages.length > 0){
                          switch(this.state.shownMessageType){
                            case 'sent':{
                              return this.state.shownMessages.map((message, i)=>{
                                return <tr
                                  className={
                                    "message-list "
                                    + (i === (this.state.shownMessages.length - 1) ? "last" : "")
                                  }
                                  key={`${message.to}-${message.hash.address}`}
                                  onClick={ ()=>{ return message.saveAs(); } }
                                  >
                                    <td><div className="no-overflow">{ message.hash.file.name }</div></td>
                                    <td className="hide-mobile"></td>                                    
                                    <td><div className="no-overflow">{ message.to }</div></td>
                                    <td className="hide-mobile"><div className="no-overflow">{ Moment(message.hash.time).format('D/MM/YYYY hh:mm ') }</div></td>
                                    <td>{ Utils.humanFileSize(message.hash.file.size) }</td>
                                  </tr>
                              })
                            }
                            case 'received': {
                              return this.state.shownMessages.map((message, i)=>{
                                return <tr
                                  className={
                                    "message-list "
                                    + (i === (this.state.shownMessages.length - 1) ? "last" : "")
                                  }
                                  key={`${message.hash.address}`}
                                  onClick={ ()=>{ return message.saveAs(); } }
                                  >
                                    <td><div className="no-overflow">{ message.hash.file.name }</div></td>
                                    <td className="hide-mobile"></td>                                    
                                    <td><div className="no-overflow">{ message.from }</div></td>
                                    <td className="hide-mobile"><div className="no-overflow">{ Moment(message.hash.time).format('D/MM/YYYY hh:mm ') }</div></td>
                                    <td>{ Utils.humanFileSize(message.hash.file.size) }</td>
                                  </tr>
                              })
                            }
                            case 'consents': {
                              return this.state.shownMessages.map((message, i)=>{
                                return <tr
                                  className={
                                    "message-list "
                                    + (i === (this.state.shownMessages.length - 1) ? "last" : "")
                                  }
                                  key={`${message.hash.address}`}
                                  onClick={ ()=>{ return message.saveAs(); } }
                                  >
                                    <td><div className="no-overflow">{ message.hash.file.name }</div></td>
                                    <td className="hide-mobile"></td>                                    
                                    <td><div className="no-overflow">{ message.from }</div></td>
                                    <td><div className="no-overflow">{ Moment(message.hash.time).format('D/MM/YYYY hh:mm ') }</div></td>
                                    <td>{ Utils.humanFileSize(message.hash.file.size) }</td>
                                  </tr>
                              })
                            }                            
                            case 'stored':
                              return this.state.shownMessages.map((hash, i)=>{
                                return <tr
                                  className={
                                    "message-list "
                                    + (i === (this.state.shownMessages.length - 1) ? "last" : "")
                                  }
                                  key={`${hash.address}`}
                                  >
                                    <td onClick=
                                      { ()=>{ return hash.saveAs(); } }
                                    >
                                      { hash.file.name }
                                    </td>
                                    <td 
                                      onClick={ ()=>{ 
                                          return this.pin(hash.address, (hash.meta && hash.meta.pinned === true) ? false : true); 
                                        } 
                                      }
                                      className="hide-mobile"
                                    >
                                      {(hash.meta && hash.meta.pinned === true) &&
                                        <img src={this.props.appRoot + "/assets/images/thumbtack-solid.svg"} alt="Pinned" className="inbox-pin"/>
                                      }
                                      {(hash.meta && hash.meta.pinned !== true) &&
                                        <img src={this.props.appRoot + "/assets/images/thumbtack-hollow.svg"} alt="Not Pinned" className="inbox-pin"/>
                                      }
                                    </td>
                                    <td></td>
                                    <td className="hide-mobile">{ Moment(hash.time).format('D/MM/YYYY hh:mm ') }</td>
                                    <td>{ Utils.humanFileSize(hash.file.size) }</td>
                                  </tr>
                              })
                            default:
                              return;
                          }
                        }else{
                          switch(this.state.shownMessageType){
                            case 'consents': 
                              return <tr className={
                                        "message-list last"
                                      }>
                                      <td>No consents yet...</td>
                                    </tr>
                            case 'stored': 
                              return <tr className={
                                        "message-list last"
                                      }>
                                      <td>No files yet...</td>
                                    </tr>
                            default:
                              return <tr className={
                                        "message-list last"
                                      }>
                                      <td>No messages yet...</td>
                                    </tr>
                          }
                        }
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Mailbox;
