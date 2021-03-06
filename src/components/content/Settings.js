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

class Settings extends Component{

  constructor(props){
    super(props);
    
    // console.log(props)

    this.togglePinFiles = this.togglePinFiles.bind(this);

    this.state = {
      storedFilesArePinned: false
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

  truncateAddress(){
    return Utils.truncate(this.props.selectedMailbox.address, 5, 5, 10);
  }

  balance(){
    return Utils.formatBalance(this.props.selectedMailboxBalance)
  }

  togglePinFiles(){
    this.setState({storedFilesArePinned: !this.state.storedFilesArePinned});
  }

  render(){
    return (
      <div className="content-outer content-fds">
        <div className="content-inner">
          <div className="content-header">
            <h1>User Settings</h1>
            {this.props.selectedMailbox && 
              <div>
                <h2>{this.props.selectedMailbox.subdomain}</h2>
                <h3>{this.balance()}</h3>
                <h3>{this.fileSize()}</h3>
                <h3>{this.pinnedFileSize()}</h3>
                <h3>{this.truncateAddress()}</h3>
              </div>
            }
            {/*
            <p>
              {this.state.storedFilesArePinned ? "Stored Files are Pinned" : "Stored Files are not Pinned"}
            </p>
            <p>
              <button onClick={this.togglePinFiles}>
                {this.state.storedFilesArePinned ? "Unpin" : "Pin"}
              </button>
            </p>
          */}
          </div>
          <div className="content-text">
	        <QRCode value="http://facebook.github.io/react/" />
            <p>
              Imagine a society of a completely private digital life where your privacy is not weaponised against you just to sell you more things.
            </p>
          </div>
        </div>
      </div>
    )
  }
}

export default Settings;
