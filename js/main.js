//edited this via browser
//From Phonegap  --anything else device specific?   app.initialize();
function deleteLocal(){
	test_db.delete().from(test).exec().then(function(){
		alert('local deleted');
	});
}

function deleteRemote(){
	$.ajax({
		type: "POST",
		url:"https://myreviewr.com/php/test-mobile.php",
			crossDomain: true,
			cache: false,
			success: function(data){
			alert(data);
			}
			});
}

function tableEvents() {
$('td').on('blur',function(){
	var loc = ($(this).parent('tr').index())+1;
	var guid = $('#from-lovefield tr:eq('+loc+ ') td:eq(1)').text();
	var question = $('#from-lovefield tr:eq('+loc+ ') td:eq(3)').text();
	var tablename = test;
	var dbname = test_db;
	updateRecord(dbname,tablename,guid,question);
});
}

function updateRecord(dbname,tablename,guid,question){
	dbname.update(tablename).
		set(tablename.question, question).
		set(tablename.update_on, update_time()).
		where(lf.op.and(
				tablename.guid.
					eq(guid))).
					exec().
	then(function(){
		dbname.update(tablename).
		set(tablename.record_stat, 'U').
		set(tablename.uploaded, 'no').
		where(lf.op.and(
				tablename.guid.eq(guid),
				tablename.uploaded.eq('yes'))).
				exec()}).
	then(function(){
		dbname.select().from(tablename).exec().then(function(rows){
			//remove this later
			htmlTable(rows,'#from-lovefield');
			tableEvents();
		});
	});
}

$('#clickme').on('click',function(){
			$('#sample-div').toggleClass('changeme');
			var val1 = $('#val1').val();
			var val2 = $('#val2').val();
			var val3 = $('#val3').val();
			$.ajax({
				type: "POST",
				url:"https://myreviewr.com/php/insert.php",
				 	data: "title="+val1+"&duration="+val2+"&price="+val3+"&insert=",
				 	crossDomain: true,
					cache: false,
					beforeSend: function(){ $("#insert").val('Connecting...');},
					success: function(data){
						alert(data);
				 	}
			});		
		});

$('#showdata').on('click',function(){
	getServerdata(function(data){
		htmlTable(data,'#display-data');
	});
	
});

function getServerdata(callback){
	var url="https://myreviewr.com/php/json.php";
	var data;
	$.getJSON(url,function(data){
		callback(data);
	});
}

function htmlTable(data,tablename) {
	var colHeader = Object.keys(data[0]);
	$(tablename+' thead tr th').remove();
	$(tablename+' tbody tr').remove();

	for(var i=0; i<colHeader.length; i++) {
		$(tablename+' thead tr').append('<th>' + colHeader[i] + '</th>');
	}

	for(var i=0; i<data.length; i++){
		$(tablename+' tbody').append('<tr></tr>');
		
		for(var j= 0; j<colHeader.length; j++){
			$(tablename +' tbody tr').last().
				append('<td contenteditable>' + data[i][colHeader[j]] + '</td>');
		}
	}
}

var LatestServer;
var LatestLocal;
function update_time(){ 
	var thisTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
	return thisTime;
}

/* LOVEFIELD */
var schemaBuilder = lf.schema.create('noeldb2', 1);

schemaBuilder.createTable('course_details').
	addColumn('id', lf.Type.INTEGER).
	addColumn('guid', lf.Type.STRING).
	addColumn('user_row', lf.Type.INTEGER).
	addColumn('question', lf.Type.STRING).
	addColumn('uploaded', lf.Type.STRING).
	addColumn('record_stat', lf.Type.STRING).
	addColumn('update_on', lf.Type.STRING).
	addPrimaryKey(['guid']);

var test_db;
var test;
schemaBuilder.connect().then(function(db) {
	test_db = db;
	test = db.getSchema().table('course_details');
}).then(function(){
	getLocaldate();
});


function addRecord(new_id){
	var dbname = test_db;
	var tablename = test;
	var username = $('#username').val();
	var user_row = $('#user_row').val();
	var question = $('#question').val();

	var row = test.createRow({
		'id': new_id,
		'guid': (username+getRand()+user_row).toLowerCase(),
		'user_row': user_row,
		'question':question,
		'uploaded': 'no',
		'record_stat':'N',
		'update_on': update_time()
  	});

  return dbname.insertOrReplace().into(tablename).values([row]).exec();
} 


$('#fromOffline').on('click',function(){
	Synchronize();
});

function Synchronize() {
	test_db.select().from(test)
	.where(lf.op.and(        
		lf.op.or(
			test.record_stat.eq('N'),
			test.record_stat.eq('U')
			),
			test.uploaded.eq('no')
			))
	.exec()
	.then(function(rows) {
		var postData = JSON.stringify(rows);
		if (postData==="[]") {
			getServerdata(function(data){			
				doUpdate(data);
			});
			console.log('local data does NOT EXIST');
		} else {
			console.log('local data exists');	
			$.ajax({
				type: "POST",		
				url: "https://myreviewr.com/php/insert-json.php",
				data: {myData:postData},
				crossDomain: true,
				cache: false,
				success: function(data){
					alert('Items added');				
					console.log('data from json.php: '+data);					
					var server_data = JSON.parse(data);
					console.log('server_data after parse: '+server_data);
					doUpdate(server_data);					
				},
				error: function(data){	
					console.log('error'+data);
					console.log('error');
				}
			});
		}
	});
}

function doUpdate(server_data){
	local_update = server_data.map(l => test.createRow(l));
	console.log('local_update vals:'+local_update);
	return test_db.
		insertOrReplace().
		into(test).
		values(local_update).
		exec().
		then(function(){
			alert('local updated');
		});
}

$('#showOffline').on('click',function(){
	test_db.
		select().
		from(test).
		exec().
		then(function(rows){
			htmlTable(rows,'#from-lovefield');
			tableEvents();
		});
});

		/*
			$('#sample-div').toggleClass('changeme');
			var val1 = $('#val1').val();
			var val2 = $('#val2').val();
			var val3 = $('#val3').val();
			$.ajax({
				type: "POST",
				url:"https://myreviewr.com/php/insert.php",
				 data: "title="+val1+"&duration="+val2+"&price="+val3+"&insert=",
				 crossDomain: true,
				 cache: false,
				 beforeSend: function(){ $("#insert").val('Connecting...');},
				 success: function(data){
				 alert(data);
				 }
				 });
			*/

function getServerdate(){
	var url="https://myreviewr.com/php/serverdate.php";
	$.getJSON(url,function(data){
		//var latest = JSON.parse(data);
		var latestD = data.map(x => x);
		var serverDate = latestD[0].last_user_update;
		//$('#serverdate').html(serverDate);	
		console.log(serverDate);
		$('#serverdate').html('most recent server update: '+serverDate);	

		LatestServer = serverDate;
	});
}

getServerdate();

function getLocaldate(){
	test_db.select(lf.fn.max(test.update_on).as("latest_local_update")).from(test).exec().then(function(data){
		var latestD = data.map(x => x);
		var localDate = latestD[0].latest_local_update;
		$('#localdate').html('most recent local update: '+localDate);
		LatestLocal = localDate; 	
	});
}

function createNewEntry(){
	test_db.select(lf.fn.max(test.id).as("latest_id")).from(test).exec().then(function(data){
		var new_id = Number((data[0].latest_id))+1;
		return new_id;	
	}).then(function(new_id){
		addRecord(new_id);
	});
}




function getRand(){
    return new Date().getTime().toString() + Math.floor(Math.random()*1000000);
}
