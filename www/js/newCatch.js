/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 * Google Map API key = AIzaSyCVagAarcAMRD8Q9Ey5mwrMgSErOUe1AOA
 *
 */

var app = {
   // Application Constructor
   initialize: function() {
       this.bindEvents();
       document.getElementById("importPicture").addEventListener("click", this.importPicture);
   },

   // Internal variables
   isReady: false,
   map: new Object(),

   // Event handling
   bindEvents: function() {
     document.addEventListener('deviceready', this.onDeviceReady, false);
     document.addEventListener('click', this.onClick, false);
   },
   onDeviceReady: function() {
     app.receivedEvent('deviceready');
     app.isReady = true;
   },
   onClick: function() {
     app.receivedEvent('deviceready');
   },
   // Update DOM on a Received Event
   receivedEvent: function(id) {
     switch (id) {
       case 'deviceready':
         // TODO: change state of "capture image" based on deviceready
         console.log('Received Event: ' + id);
         break;
       default:
         console.log('Received Event: ' + id + '. Not sure what to do about it...');
     }
   },
   importPicture: function() {
     if(!app.isReady){
       printExifTable({Error:"Device is not ready"});
     }
     else {
       // prepare tons of functions to open system dialog to select picture
       var cameraSuccess = function (result) {
         // Result should be a device specific URL. Due to the Gods of programming,
         // this have given me several headaches. Solved by picking the right
         // camera success method based on the string received.

         //  If there is a basic pattern corresponding to URI, do the URI method
         if (result.indexOf("://") > 0) {
           // if it's the funny iPhone URL, try to tamper with it :S
           cameraSuccessURI(result);
         } else {
           // Do the String method
           cameraSuccessString64(result);
         }
       };

       var cameraError = function (message){
         printExifTable({Error:"Error obtaining image: " + JSON.stringify(message)});
       };

       var cameraOptions = {
         destinationType: Camera.DestinationType.NATIVE_URI,
         sourceType: Camera.PictureSourceType.PHOTOLIBRARY
       };

       // At least! We can ask for the fkn picture:
       navigator.camera.getPicture(cameraSuccess, cameraError, cameraOptions);
     }
   }, // importPicture
   initMap: function() {
     map = new google.maps.Map(document.getElementById('map'), {
       center: {lat: -33.457521, lng: -70.662246},
       scrollwheel: false,
       // Apply the map style array to the map.
       styles: mapStyle,
       zoom: 15
     });
   } // initMap
}; // app

var cameraSuccessString64 = function(imageString){
  if (imageString) {
    var blobImage = base64toBlob(imageString);
    loadImage.parseMetaData(blobImage, parseSuccess);
  } else {
    // Empty image
    printExifTable({Error:"Image was valid but empty (???)"});
  }
}; // cameraSuccessString64

var cameraSuccessURI = function (URIString) {
  if (URIString) {
    var jpgFile = 0;
    window.resolveLocalFileSystemURL(URIString, function(fileEntry) {
      fileEntry.file(function(theFile) {
        var reader = new FileReader();
        reader.onloadend = function(event) {
          console.log("Read " + event.target.result.byteLength);
        };
        loadImage.parseMetaData(theFile, parseSuccess);
      });
    },
    function(message) {
      printExifTable({Error:"Error resolving URL: " + JSON.stringify(message)});
    }); //resolveLocalFileSystemURL
  } else {
    // Empty image
    printExifTable({Error:"Image was valid but empty (???)"});
  }
}; // cameraSuccessURI

var parseSuccess = function (data) {
  var exif = new Object();
  if (data.exif) {
    var tags = data.exif.getAll();
    for (var key in tags) {
      if (tags.hasOwnProperty(key)) {
       exif[key] = tags[key];
      }
    }
  } else {
    // Image exists, but no exif?!
    exif["Error"] = ["Image found, empty exif"];
  }
  updateThumbnailHtml(data.exif.get('Thumbnail'), data.exif.get('Orientation'));
  updateExifHtml(exif);
  updateMapHtml(exif);
};

// Does exactly what the name inplies. Found online.
var base64toBlob = function(base64Data, contentType) {
    contentType = contentType || 'image/jpeg';
    var sliceSize = 1024;
    var byteCharacters = atob(base64Data);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0 ; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
}

var updateExifHtmlAll = function (values) {
  //displaying ALL values. Deprecated, needed for debugging purposes
  var exifTable = document.getElementById("exifTable");
  for (var key in values) {
    if(values.hasOwnProperty(key)) {
      var cell1 = document.createElement("td");
      var cell2 = document.createElement("td");
      var row = document.createElement("tr");
      cell1.appendChild(document.createTextNode(key));
      cell2.appendChild(document.createTextNode(values[key]))
      row.appendChild(cell1);
      row.appendChild(cell2);
      exifTable.appendChild(row);
    }
  }
}

var updateExifHtml = function (values) {
  var exifTable = document.getElementById("exifTable");
  var keys = [
    "Error",
    "GPSLatitude",
    "GPSLongitude",
    "GPSLatitudeRef",
    "GPSLongitudeRef",
    "DateTimeOriginal",
    "Orientation"
  ];
  for (var key in values) {
    if(values.hasOwnProperty(key) && (keys.indexOf(key) > -1)) {
      var cell1 = document.createElement("td");
      var cell2 = document.createElement("td");
      var row = document.createElement("tr");
      cell1.appendChild(document.createTextNode(key));
      cell2.appendChild(document.createTextNode(values[key]))
      row.appendChild(cell1);
      row.appendChild(cell2);
      exifTable.appendChild(row);
    }
  }
}

var updateThumbnailHtml = function (thumb, orientation) {
  var thumbNode = document.getElementById("imgTable");
  if (thumb) {
    loadImage(thumb, function (img) {
      var cell = document.createElement("td");
      var row = document.createElement("tr");
      cell.appendChild(img)
      row.appendChild(cell);
      thumbNode.appendChild(row);
    },
    {orientation: orientation});
  } else {
    var cell = document.createElement("td");
    cell.appendChild(document.createTextNode("No thumbnail available"));
    var row = document.createElement("tr");
    row.appendChild(cell);
    thumbNode.appendChild(row);
  }
}

var updateMapHtml = function (values) {
  var lat = coordTransform(values.GPSLatitude, values.GPSLatitudeRef);
  var lng = coordTransform(values.GPSLongitude, values.GPSLongitudeRef);
  var newLoc = new google.maps.LatLng(lat, lng);
  map.setCenter(newLoc);
  document.getElementById("map").style.display = "block";
}

var coordTransform = function (coord, coordRef) {
  var r = 0;
  var values = coord.split(",");
  r = values[0] + values[1]/60 + values[2]/3600;
  if (coordRef === "S" || coordRef === "W")
    r *= -1;
  return r;
}

var mapStyle = [
  {
    "elementType": "geometry.fill",
    "stylers": [
      { "gamma": 2.0 }
    ]
  },{
    "featureType": "administrative",
    "stylers": [
      { "visibility": "simplified" }
    ]
  },{
    "featureType": "poi",
    "stylers": [
      { "visibility": "off" }
    ]
  },{
    "featureType": "poi.park",
    "stylers": [
      { "visibility": "on" }
    ]
  },{
    "featureType": "water",
    "stylers": [
      { "gamma": 0.3 }
    ]
  },{
    "featureType": "water",
    "elementType": "labels",
    "stylers": [
      { "hue": "#ff0033" }
    ]
  }
];
