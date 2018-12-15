import React, { Component } from 'react';
import DTransfer from '../services/DTransfer';
import DMailbox from '../services/DMailbox';
import DMessage from '../services/DMessage';
import DFileData from '../services/DFileData';

import ASelectFile from '../components/up/ASelectFile';
import BSelectMailbox from '../components/up/BSelectMailbox';
import CSelectRecipient from '../components/up/CSelectRecipient';
import DConfirm from '../components/up/DConfirm';
import EInProgress from '../components/up/EInProgress';
import FCompleted from '../components/up/FCompleted';
import ProgressBar from '../components/up/ProgressBar';


window.DMailbox = DMailbox;

class DTransferUp extends Component{

  // initialise

  getInitialState() {
    return {
      shouldEncrypt: false,
      fileIsSelecting: false,
      fileIsSelected: false,

      selectedFileName: null,
      selectedFileSize: null,

      feedBackMessage: false,

      isSignedIn: false,

      isSending: false,
      sendToEmails: [],

      uiState: 0,

      selectedMailbox: false,
      selectedWallet: false,

      addressee: false,

      mailboxPassword: false,

      fileWasEncrypted: false,
      fileWasUploaded: false,

      isStoringFile: false,

      dTransferLink: null,
      uploadedFileHash: null,
      encryptMessage: 'Unencrypted',      
      sendButtonMessage: 'Upload Unencrypted',
    };
  }

  resetToInitialState(){
    this.setState(this.getInitialState());
  }

  constructor(props){
    super(props);

    this.FDS = this.props.FDS;

    // this.DT = new DTransfer(process.env.REACT_APP_SWARM_GATEWAY);

    this.aSelectFile = React.createRef();

    this.state = this.getInitialState();
  }

  setUIState(state){
    this.setState({
      uiState: state
    });
  }

  handleUpload(){
    let feedbackCallback = (msg)=>{this.setState({feedBackMessage: msg});};

    if( // ensure that we have a file saved from dropzone
      window.selectedFileArrayBuffer.constructor === ArrayBuffer &&
      window.selectedFileArrayBuffer.byteLength > 0
      )
    {
      if(this.state.isStoringFile === false){
        let senderMailbox = this.state.selectedMailbox;
        let senderWallet = this.state.selectedWallet;
        let addressee = this.state.addressee;

        return this.FDS.currentAccount.send(
          addressee, 
          new File(
            [window.selectedFileArrayBuffer],
            this.state.selectedFileName,
            {type: this.state.selectedFileType}
          ),
          ()=>{
            this.setState({encryptMessage: 'Encrypted'});
            this.setState({feedBackMessage: "File was encrypted, uploading file..."}); 
            this.setState({fileWasEncrypted: true});
          },
          (response)=>{
            this.setState({feedBackMessage: "File uploaded."});
          }
        ).catch((error) => {
          this.setState({feedBackMessage: error});
          this.setState({fileWasUploaded: true});
        });

      }else{
        return this.FDS.currentAccount.store(
          new File(
            [window.selectedFileArrayBuffer],
            this.state.selectedFileName,
            {type: this.state.selectedFileType}
          ),
          ()=>{
            this.setState({encryptMessage: 'Encrypted'});
            this.setState({feedBackMessage: "File was encrypted, uploading file..."}); 
            this.setState({fileWasEncrypted: true});
          },
          (response)=>{
            this.setState({feedBackMessage: "File uploaded."});
          }
        ).catch((error) => {
          this.setState({feedBackMessage: error});
          this.setState({fileWasUploaded: true});
        });

      }
    }else{
      this.setState({feedBackMessage: "There was an error, please try again..."});
      return false;
    }
  }

  render() {
    return (
        <div className="dt-upload">
          <ASelectFile 
            parentState={this.state} 
            setParentState={this.setState.bind(this)} 
            setIsSelecting={this.props.setIsSelecting} 
            fileWasSelected={this.props.fileWasSelected} 
            ref={this.aSelectFile}
          />
          <BSelectMailbox 
            FDS={this.FDS}
            parentState={this.state} 
            setParentState={this.setState.bind(this)}
          />
          <CSelectRecipient 
            FDS={this.FDS}
            parentState={this.state} 
            setParentState={this.setState.bind(this)}
          />
          <DConfirm 
            parentState={this.state} 
            setParentState={this.setState.bind(this)}
            handleUpload={this.handleUpload.bind(this)}
          />
          <EInProgress 
            parentState={this.state} 
            setParentState={this.setState.bind(this)
          }/>
          <FCompleted 
            parentState={this.state} 
            setParentState={this.setState.bind(this)
          }/>
          <ProgressBar 
            parentState={this.state} 
            setParentState={this.setState.bind(this)} 
            isStoringFile={this.props.isStoringFile}
          />
        </div>
    );
  }
}

export default DTransferUp;