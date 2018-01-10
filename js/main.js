const apiKey = 'AIzaSyB_4ELGPiJhFBxOkYmHbErEDECt_bROEM8';
const clientId = '612657856529-84naj5l18uhqu93bdvlkp3psfnj7fqvh.apps.googleusercontent.com';
const scope = 'https://www.googleapis.com/auth/drive.readonly';
const appId = 'calibre-web-186715';

var pickerApiLoaded = false;
var oauthToken;
var DB, currentView;

// Use the Google API Loader script to load the google.picker script.
function loadPicker() {
  gapi.load('auth', {'callback': () => {
    window.gapi.auth.authorize({
      'client_id': clientId,
      'scope': scope,
      'immediate': false
    }, authResult => {
      if (authResult && !authResult.error) {
        oauthToken = authResult.access_token;
        createPicker();
      }
    });
  }});
  gapi.load('picker', {'callback': () => {
    pickerApiLoaded = true;
    createPicker();
  }});
}

// Create and render a Picker object for searching images.
function createPicker() {
  if (pickerApiLoaded && oauthToken) {
    let view = new google.picker.DocsView(google.picker.ViewId.DOCS);
      view.setIncludeFolders(true);
      view.setSelectFolderEnabled(true);
      view.setQuery('metadata.db');
    let picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setAppId(appId)
        .setOAuthToken(oauthToken)
        .addView(view)
        .addView(new google.picker.DocsUploadView())
        .setCallback(pickerCallback)
        .build();
     picker.setVisible(true);
  }
}

// A simple callback implementation.
function pickerCallback(data) {
  if (data.action == google.picker.Action.PICKED) {
    if (data.docs[0].id) {
      $('#loading-modal').modal('show');
      var accessToken = gapi.auth.getToken().access_token;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://www.googleapis.com/drive/v2/files/' + data.docs[0].id + '?alt=media');
      xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        DB = new SQL.Database(new Uint8Array(this.response));
        $('#splash-banner').slideUp();
        $('#views').slideDown();
        $('#loading-modal').modal('hide');
        currentView = DB.exec('SELECT title as Title, author_sort as Author, path FROM books;');
        refreshTable();
      };
      // xhr.onerror = function() { callback(null) };
      xhr.send();
    }
  }
}

function refreshViews(){
  refreshTable();
  refreshBookshelf();
}

function refreshTable(){
  $('table').DataTable({
    data: currentView[0].values,
    columns: currentView[0].columns.map(c => ({title: c}))
  });
}

function refreshBookshelf(){

}

$(function(){
  $('html').removeClass('no-js');
  $('#google-drive-signin').click(loadPicker);
});
