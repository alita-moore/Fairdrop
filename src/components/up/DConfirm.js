import React, { Component } from 'react';

class DConfirm extends Component{
  
  constructor(props) {
    super(props);

    this.state = {
      feedbackMessage: ""
    }

    this.handleEncryptAndSend = this.handleEncryptAndSend.bind(this);    
    this.handleCancel = this.handleCancel.bind(this);
  }

  handleCancel(){
    this.setState({feedbackMessage: ""});
    this.props.setParentState({
      uiState: 3,
    });
  }

  handleEncryptAndSend(){
    this.props.setParentState({
      uiState: 4,
    });
    setTimeout(()=>{
      this.props.handleUpload().then(()=>{
        this.props.setParentState({
          uiState: 5
        }); 
      })
    }, 2000);
  }

  render(){
    return (
      <div id="dt-confirm" className={"dt-confirm dt-green dt-page-wrapper dt-hidden " + (this.props.parentState.uiState === 3 ? "dt-fade-in" : "")}> 
        <div className="dt-confirm-ui dt-page-inner-centered">
          <div className="dt-page-inner-wrapper">
            <h1 className="dt-confirm-header">Confirm</h1>          
            <div className="dt-confirm-ui-group clearfix">
              <table>
                <tablebody>
                  <tr>
                    <td>File:</td><td>{this.props.parentState.selectedFileName}</td><td>{this.props.parentState.selectedFileSize}</td>
                  </tr>
                  <tr>
                    <td>Sender:</td><td>{this.props.parentState.selectedMailbox.subdomain}.datafund.eth</td><td></td>
                  </tr>
                  <tr>
                    <td>Recipient:</td><td>{this.props.parentState.addressee}.datafund.eth</td><td></td>
                  </tr>
                </tablebody>
              </table>
            </div>
            <div className="dt-btn-group">
              <button className="dt-confirm-encrypt-and-send dt-btn dt-btn-lg dt-btn-green dt-btn-float-left" onClick={this.handleEncryptAndSend}>Encrypt and Send</button>              
              <button className="dt-confirm-cancel dt-btn dt-btn-lg dt-btn-link dt-btn-float-right" onClick={this.handleCancel}>Cancel</button>              
            </div>        
          </div>
        </div>
      </div>
    )
  }
}

export default DConfirm;