<html>
  <head>
    <script type="text/javascript">
      // Your Client ID can be retrieved from your project in the Google
      // Developer Console, https://console.developers.google.com
      var CLIENT_ID = '<Cant keep this here>';

      var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.modify'];
      var messageArray = [];
      var recursionCount = 500;
      var currentRecurionsCount = 0;
      /**
       * Check if current user has authorized this application.
       */
      function checkAuth() {
        gapi.auth.authorize(
          {
            'client_id': CLIENT_ID,
            'scope': SCOPES.join(' '),
            'immediate': true
          }, handleAuthResult);
      }

      /**
       * Handle response from authorization server.
       *
       * @param {Object} authResult Authorization result.
       */
      function handleAuthResult(authResult) {
        var authorizeDiv = document.getElementById('authorize-div');
        if (authResult && !authResult.error) {
          // Hide auth UI, then load client library.
          authorizeDiv.style.display = 'none';
          loadGmailApi();
        } else {
          // Show auth UI, allowing the user to initiate authorization by
          // clicking authorize button.
          authorizeDiv.style.display = 'inline';
        }
      }

      /**
       * Initiate auth flow in response to user clicking authorize button.
       *
       * @param {Event} event Button click event.
       */
      function handleAuthClick(event) {
        gapi.auth.authorize(
          {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
          handleAuthResult);
        return false;
      }

      /**
       * Load Gmail API client library. List labels once client library
       * is loaded.
       */
      function loadGmailApi() {
        gapi.client.load('gmail', 'v1', listHistory);
      }

      /**
       * Print all Labels in the authorized user's inbox. If no labels
       * are found an appropriate message is printed.
       */
      function listLabels() {
        var request = gapi.client.gmail.users.labels.list({
          'userId': 'me'
        });

        request.execute(function(resp) {
          var labels = resp.labels;
          appendPre('Labels:');

          if (labels && labels.length > 0) {
            for (i = 0; i < labels.length; i++) {
              var label = labels[i];
              appendPre(label.name)
            }
          } else {
            appendPre('No Labels found.');
          }
        });
      }


      function listHistory() {
        var getPageOfHistory = function(request, result) {
          currentRecurionsCount++;
          
          console.log(currentRecurionsCount + "of : "+recursionCount)

          request.execute(function(resp) {
            result = result.concat(resp.history);
            var nextPageToken = resp.nextPageToken;

            if (nextPageToken && currentRecurionsCount < recursionCount) {
              request = gapi.client.gmail.users.history.list({
                'userId': 'me',
                'startHistoryId': 39183301,
                'pageToken': nextPageToken
              });
              getPageOfHistory(request, result);
            } else {
              console.log("Iterations : " + currentRecurionsCount);
              searchForMarkUnread(result);
            }

          });
        };
        var request = gapi.client.gmail.users.history.list({
          'userId': 'me',
          'startHistoryId': 39183301
        });
        getPageOfHistory(request, []);
      } 

      
      function searchForMarkUnread(historyArray){
        

        for(i=0;i<historyArray.length;i++){
          var currentHistoryItem = historyArray[i];

          if(currentHistoryItem.labelsRemoved){


            for(j=0;j<currentHistoryItem.labelsRemoved.length;j++){
               var removedLabel = currentHistoryItem.labelsRemoved[j];

               if(removedLabel.labelIds){
                  for(k=0;k<removedLabel.labelIds.length;k++){
                    if(removedLabel.labelIds[k] == "UNREAD"){
                        if (messageArray.indexOf(removedLabel.message.id) === -1) {
                            messageArray.push(removedLabel.message.id);
                        }
                        else{
                          console.log("Duplicate found");
                        }
                        //messageArray.push(removedLabel.message.id)
                        
                    }
                  }
               }
            }
          }
        }
        console.log("Mails found : " + messageArray.length)
        modifyMessages();

      }

      function modifyMessages(){

        if(messageArray.length){
          modifyMessage("me",messageArray[messageArray.length-1],["UNREAD"],[],showMessage);
          
        }
        

      }

      function modifyMessage(userId, messageId, labelsToAdd, labelsToRemove, callback) {
        var request = gapi.client.gmail.users.messages.modify({
          'userId': userId,
          'id': messageId,
          'addLabelIds': labelsToAdd,
          'removeLabelIds': labelsToRemove
        });
        request.execute(callback);
      }

      var modifiedMessageArray = [];

      function showMessage(resp){
        var dateOfMessage = new Date(parseInt(resp.internalDate)).toDateString();


        modifiedMessageArray.push(resp.id+ " : " + dateOfMessage + " : " + resp.snippet);
        console.log(resp.id+ " : " + dateOfMessage + " : " + resp.snippet);

        if(!resp.code){
          messageArray.pop();
          modifyMessages();
        }
        else{
          window.setTimeout(function(){
            modifyMessages();
          },5000);
        }
      }


      /**
       * Append a pre element to the body containing the given message
       * as its text node.
       *
       * @param {string} message Text to be placed in pre element.
       */
      function appendPre(message) {
        var pre = document.getElementById('output');
        var textContent = document.createTextNode(message + '\n');
        pre.appendChild(textContent);
      }

    </script>
    <script src="https://apis.google.com/js/client.js?onload=checkAuth">
    </script>
  </head>
  <body>
    <div id="authorize-div" style="display: none">
      <span>Authorize access to Gmail API</span>
      <!--Button for the user to click to initiate auth sequence -->
      <button id="authorize-button" onclick="handleAuthClick(event)">
        Authorize
      </button>
    </div>
    <pre id="output"></pre>
  </body>
</html>
