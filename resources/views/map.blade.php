<!DOCTYPE html>
   <html>
   <head>
	<meta charset="utf-8" />
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.0.3/dist/leaflet.css" />
	<script src="https://unpkg.com/leaflet@1.0.3/dist/leaflet.js"></script>
      <style>
        body {
            padding: 0; margin-top: 180; margin: 0;
        }
        .legend {
          font-size: 18px; line-height: 24px; color: #333333; font-family: 'Open Sans', Helvetica, sans-serif;
	        padding: 10px 14px;  background-color: rgba(245,245,220,0.8) ;  box-shadow: 0 0 15px rgba(0,0,0,0.2);
	        border-radius: 12px;  max-width: 400px;  border: 5px solid grey;
        }
        .legend p {
	        font-size: 18px; line-height: 24px;
        }
        .legend img {
	        max-width: 200px; align: left; display: block;
        }
        .center {
          display: block; margin-left: auto; margin-right: auto; width: 50%;
        }
        .container {
           display: flex; margin-top: 180;
          }

        img {
          margin: 6px;
          }
      </style>
        </head>
<body>
<div id="map" style="width: 100%; height: 920px"></div>
		<script type="text/javascript">
        //markörer
         var icon1 = {iconUrl: 'img/target.png',iconSize: [29, 45]}
         var target1 = L.icon(icon1);
         var marker1 = {clickable: true,icon: target1}
         var icon2 = {iconUrl: 'img/redpin.png',iconSize: [29, 45]}
         var target2 = L.icon(icon2);
         var marker2 = {clickable: true,icon: target2}
         var icon3 = {iconUrl: 'img/blue.png',iconSize: [29, 45]}
         var target3 = L.icon(icon3);
         var marker3 = {clickable: true,icon: target3}
         var locations = [
@foreach ($data as $i)
[ "{{ $i->name }}  " + "i " + "{{ $i->contact_city }}" +  " <br>" + "{{ $i->date }}" + "   Anmälda: " + "{{ $i->signups_count }}"+ " <br>"  + "Anmälan stänger " + "{{ $i->signups_closing_date }}" , 
{{ $i->lat }},{{ $i->lng }},0, "{{ $i->signups_closing_date }}" , "{{ $i->signups_opening_date }}" , "{{ $i->closed_at }}" , "{{ $i->is_public }}",
'http://localhost:8080/app/competitions/'+ "{{ $i->id }}" + '/information', "{{ $i->date }}", 
"{{ $i->name }}  " + "i " + "{{ $i->contact_city }}"+ " <br>" + "{{ $i->date }}" + " Avslutad/Genomförd", 
"{{ $i->name }}  " + "i " + "{{ $i->contact_city }}" + " " + "{{ $i->date }}" +  " <br>" + "Anmälan öppnar " + "{{ $i->signups_opening_date }}",
"{{ $i->name }}  " + "i " + "{{ $i->contact_city }}"+ " <br>" + "{{ $i->date }}" + " Anmälan stängd"],
@endforeach         
];
        var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var osmAttrib='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});
		var map = new L.Map('map').addLayer(osm).setView([59.55,12.26], 5);
    map.options.minZoom = 3;
    map.options.maxZoom = 18;
var t=new Date();
var visa;
var ldstr=t.toLocaleDateString(); // Today's date.
for (i = 0; i < locations.length; i++) {  
    end=new Date(locations[i][6]);
    date1=new Date(locations[i][4]);
    date2=new Date(ldstr);
    date3=new Date(locations[i][5]);
    date4=new Date(locations[i][9]); //
var newLat = locations[i][1] + (Math.random() -.15) / 20;// * (Math.random() * (max - min) + min);
var newLng = locations[i][2] + (Math.random() -.15) / 20;// * (Math.random() * (max - min) + min);

if ((locations[i][6]) || (locations[i][7]) == 0) {               // closed or not public
   var marker = new L.marker([newLat, newLng],marker3);
    marker.url = locations[i][8];
    marker.bindPopup(locations[i][0]);
  //  marker.addTo(map);  //Visas ej för stängd 
    marker.on('click', function(){
window.location = (this.url);
});marker.on('mouseover', function (e) {this.openPopup();});
    marker.on('mouseout', function (e) {  this.closePopup();});
  } else if ( date2 > date4 ) {                                       // finished
  var marker = new L.marker([newLat, newLng], marker2);
  marker.url = locations[i][8];
  marker.bindPopup(locations[i][10]);
  marker.addTo(map);
  marker.on('click', function(){
window.location = (this.url);
});marker.on('mouseover', function (e) {this.openPopup();});
  marker.on('mouseout', function (e) {this.closePopup();});
} else if ( date2 >date1 ) {                                       // signups closed
  var marker = new L.marker([newLat, newLng], marker2);
  marker.url = locations[i][8];
  marker.bindPopup(locations[i][12]);
  marker.addTo(map);
  marker.on('click', function(){
window.location = (this.url);
});marker.on('mouseover', function (e) {this.openPopup();});
  marker.on('mouseout', function (e) {this.closePopup();});
} else if ( date2 < date3 ) {                                       // upcoming
  var marker = new L.marker([newLat, newLng], marker3);
  marker.url = locations[i][8];
  marker.bindPopup(locations[i][11]);
  marker.addTo(map);
  marker.on('click', function(){
window.location = (this.url);
});marker.on('mouseover', function (e) {this.openPopup();});
  marker.on('mouseout', function (e) {this.closePopup();});
} else {
  var marker = new L.marker([newLat, newLng], marker1);             // signups open
  marker.url = locations[i][8];
  marker.bindPopup(locations[i][0]);
  marker.addTo(map);
  marker.on('click', function(){
window.location = (this.url);
});marker.on('mouseover', function (e) {this.openPopup();});
  marker.on('mouseout', function (e) {this.closePopup();});
       }; 
}
function onClick(e) {
window.open(this.options.url);
                    }
var legend = L.control({position: "topleft", });
legend.onAdd = function(map) {
	var div = L.DomUtil.create("div", "legend");
  		    
    div.innerHTML = 
        ' <a href="http://localhost:8080/app/" class="button"> <img src="img/webshooter-logo.png" class="center" </a></p>' +
        ' <p style="text-align:center;"> <a href="{{ url()->previous() }}" class="button">Tillbaka till webshooter</a> </p>' +
        '<p>Håll muspekaren över tävlingsikonen för att se vilken typ av tävling det är, datum för tävlingen samt antal anmälda. Klicka för att komma till tävlingen där du kan anmäla dig när du är inloggad.</p>' +
        ' Det kan finnas fler än en tävling på samma ort, zooma in så ser du de olika.<br><br>' +
        '<div class="container"><img src="img/target.png" /> Öppen för<br>anmälan.</div>' +
        '<div class="container"><img src="img/blue.png" /> Kommande, anmälan ej<br>öppen ännu.</div>' +
        '<div class="container"><img src="img/redpin.png" /> Anmälan stängd eller avslutad/genomförd.<br>Ev. kan efteranmälan göras.</div>' +
        'Helt stängda tävlingar visas ej på kartan, men de kan finnas på hemsidan.' +
        '<br><small>Search by <a  href="https://locationiq.com"> LocationIQ.com  </a>';;
	// Return the Legend div containing the HTML content
	return div;

};
legend.addTo(map);
</script>
</body>
</html>