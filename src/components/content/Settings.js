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
import {notificationPermission} from '../../lib/FDSNotify.js';
import QRCode from 'qrcode.react';
import Utils from '../../services/Utils';
import Dropdown from 'react-dropdown';
import Switch from "react-switch";


//deal with xbrowser copy paste issues
var ua = window.navigator.userAgent;
var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
var webkit = !!ua.match(/WebKit/i);
var iOSSafari = iOS && webkit && !ua.match(/CriOS/i);

class Settings extends Component{

  constructor(props){
    super(props);
    
    this.state = {
      storedFilesArePinned: false
    }
    
    this.handleChangeAnalytics = this.handleChangeAnalytics.bind(this);
    this.handleChangePinFiles = this.handleChangePinFiles.bind(this);
    this.handleChangeHonestInbox = this.handleChangeHonestInbox.bind(this);

  }

  handleCopyGatewayLink(){

    if(iOSSafari){
      var el = document.querySelector(".mailbox-address-input");
      var oldContentEditable = el.contentEditable,
          oldReadOnly = el.readOnly,
          range = document.createRange();

      el.contentEditable = true;
      el.readOnly = false;
      range.selectNodeContents(el);

      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(range);

      el.setSelectionRange(0, 999999); // A big number, to cover anything that could be inside the element.

      el.contentEditable = oldContentEditable;
      el.readOnly = oldReadOnly;

      document.execCommand('copy');
    }else{
      var copyText = document.querySelector(".mailbox-address-input");
      copyText.select();
      document.execCommand("copy");
    }
  }  

  fileSize(){
    if(this.props.savedAppState.totalStoredSize){
      return Utils.humanFileSize(this.props.savedAppState.totalStoredSize);
    }else{
      return " - "
    }
  }

  pinnedFileSize(){
    if(this.props.savedAppState.totalPinnedSize){
      return Utils.humanFileSize(this.props.savedAppState.totalPinnedSize);
    }else{
      return " - "
    }
  }

  pinnedTimeRemaining(){
    if(this.props.savedAppState.pinnedTimeRemainingInSecs){
      return Utils.humanTime(this.props.savedAppState.pinnedTimeRemainingInSecs);
    }else{
      debugger
      return " - "
    }
  }

  mailboxAddress(){
    return this.props.selectedMailbox.address;
  }

  balance(){
    return Utils.formatBalance(this.props.selectedMailboxBalance);
  }

  handleChangeAnalytics(input){
    this.props.saveAppState({
      analytics: input
    });
  }

  handleChangePinFiles(input){
    this.props.saveAppState({
      pinFiles: input
    });
  }

  handleChangeHonestInbox(input){
    this.props.saveAppState({
      honestInbox: input
    });
  }


  render(){
    return (
      <div className="content-outer content-fds">
        <div className="settings-outer">
          <h2>{this.props.selectedMailbox.subdomain}</h2>
        </div>
        <div className="content-inner">
          <div className="content-header">
            <div className="settings-inner">
            <h1>Mailbox Settings</h1>
            {this.props.selectedMailbox && 
              <div>
                <label>Mailbox</label>
                <h3>
                  <input className="mailbox-address-input" type="text" value={this.mailboxAddress()}/>
                  <div onClick={this.handleCopyGatewayLink} className="settings-copy-address">Copy</div>
                </h3>
                <label>Mailbox</label>
                <QRCode value={'fds://'+this.mailboxAddress()} />
                <label>Balance</label>
                <h3>{this.balance()}</h3>
                <label>Storage Provider</label>
                <Dropdown
                  options={["FDS EUROPA POOL (1)"]}
                  value={"FDS EUROPA POOL (1)"}
                  placeholder="Select a mailbox"
                />
                <label>Stored Currently</label>
                <h3>{this.fileSize()}</h3>
                <h3>{this.pinnedFileSize()}</h3>
                <label>Stored Time Remaining</label>
                <h3>{this.pinnedTimeRemaining()}</h3>
                <label>Opt in for Analytics</label>
                <Switch onChange={this.handleChangeAnalytics} checked={this.props.savedAppState.analytics} />
                <label>Opt in for Pin Files</label>
                <Switch onChange={this.handleChangePinFiles} checked={this.props.savedAppState.pinFiles} />
                <label>Opt in for Honest Inbox</label>
                <Switch onChange={this.handleChangeHonestInbox} checked={this.props.savedAppState.honestInbox} />
              </div>
            }
            </div>
          </div>
          <div className="content-text">
	        
            <p>
              Imagine a society of a completely private digital life where your privacy is not weaponised against you just to sell you more things.
            </p>
          </div>
          <button onClick={()=>{this.props.toggleContent(false)}}>Hide</button>
        </div>
      </div>
    )
  }
}

export default Settings;
