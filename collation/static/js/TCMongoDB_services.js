TCMongoDB_services = (function() {

  //function called on document ready
  $(function () {
    CL.setServiceProvider(TCMongoDB_services);
  });

  //compulsory settings

  const supportedRuleScopes = {'once': 'This place, these wits',
	    			                   'always': 'Everywhere, all wits'};

  const allowWitnessChangesInSavedCollations = true;

  getUserInfo = function (success_callback) {
    success_callback(_local_user);
  };
  
 
 /* initialiseEditor = function () {
    getCurrentEditingProject(CL.loadIndexPage);
    //in local services everyone is a managing editor as they are not collaborative projects
    CL.managingEditor = true;
	if (TCMongoDB_services._mode=="reg") {
		RG.getCollationData("editor", 0);
	} 
  };
  */
  //version suggested by Cat
  initialiseEditor = function () {
    console.log("new initializaton")
	CL.managingEditor = true;
	let callback = function (project) {
		CL.loadIndexPage(project);
		if (TCMongoDB_services._mode=="reg") {
			 RG.getCollationData("editor", 0);
		 }
	  }
	 getCurrentEditingProject(callback);
  };
 
   
   _get_resource = function (resource_type, result_callback) {
		//we have to parse the resource_type string and figure out how to read this from the database
		//urls to call: /ceconfig/?community gives config.json
		// and: cewitness/?witness=Hg&community=CTP&entity=CTP:Group=GP:line=1
		if (TCMongoDB_services._dbUrl==null) {
//			console.log("(TCMongoDB_services._dbUrl not initialized yet")
			var url = _data_repo + resource_type + '?defeat_cache='+new Date().getTime();
			$.get(url, function(resource) {
			  result_callback(resource, 200);
			}, 'text').fail(function(o) {
			  result_callback(null, o.status);
			});
		} else {
//			console.log("starting out "+TCMongoDB_services._dbUrl);
			var url = TCMongoDB_services._dbUrl + resource_type + '&defeat_cache='+new Date().getTime();
//			console.log(url);
			$.get(url, function(resource) {
	//			console.log("got it "+resource)
				result_callback(resource, 200);
			}, 'text').fail(function(o) {
				result_callback(null, o.status);
			});
		}
  } 


_load_witnesses = function (verse, witness_list, finished_callback, results, i) {
			//Here we check our parallels entry...
	let parallels=[];
	let srchEntity=TCMongoDB_services._entity.replace(TCMongoDB_services._community+":",TCMongoDB_services._community+"/" );
	try {
    	eval(TCMongoDB_services.collationparallels);
    }  catch (e) {
		alert(e.message);
	}
	if ((typeof collparallels!="undefined") && collparallels.length>0) {  //cope with two kinds of parallel
		if (collparallels[0][0].hasOwnProperty("entity")) {
			for (let i=0; i<collparallels.length; i++) {
				if (collparallels[i].filter(parallel=>parallel.entity==srchEntity).length) {
					parallels=collparallels[i];
					break;
				}
			}
		} else {
			for (let i=0; i<collparallels.length; i++) {
				if (collparallels[i].filter(parallel=>parallel==srchEntity).length) {
					let myArr=collparallels[i];
					for (let j=0; j<myArr.length; j++) {
						parallels.push({entity: myArr[j], suffix:""})
					}
					break;
				}
			}
		}
	} else {
		parallels.push({entity:TCMongoDB_services._entity, suffix:""});
	}
	if (parallels.length==0) parallels.push({entity:TCMongoDB_services._entity, suffix:""});
	
//	if ()
	for (let i=0; i<parallels.length;i++) {
		parallels[i].entity=parallels[i].entity.replace(TCMongoDB_services._community+"/", TCMongoDB_services._community+":");
	}
//	var url= TCMongoDB_services._dbUrl+'getCEWitnesses/?community='+TCMongoDB_services._community;
	var url= TCMongoDB_services._dbUrl+'fetchCEWitness/?community='+TCMongoDB_services._community;
//	console.log("about to load")
	//here we are going to use async
	var results=[];
	var nWit=0;
	async.mapSeries(witness_list, function(witness, callback){
		$.ajax({
			type: 'POST',
			url: url,
			data: JSON.stringify({witnesses: witness_list, base: CL.dataSettings.base_text, parallels: parallels, entity:  TCMongoDB_services._entity, override: true, nWit:nWit}),
			accepts: 'application/json',
			contentType: 'application/json; charset=utf-8',
			dataType: 'json'
		})
		.done (function(data){
			//check that we have base..
			if (!data.success) {
				alert("Error reading in the witnesses");
				CL.dataSettings.witness_list=[]; //reset to null
				finished_callback([]);
			}
			else  {  //note. In this embedded we are not checking if the base exists. We do that before the collation starts
				//we might have a warning message: so send it
				if (data.errorMessage!="") alert(data.errorMessage);
				for (var i=0;i<data.result.length;i++) {
					if (Object.keys(data.result[i]).length) {
						let myResult=JSON.parse(data.result[i]);
						_renameProperty(myResult, "transcription_id", "transcription");
						results.push(myResult);
	//					console.log("witness "+data.result[i])
					}
				}
				nWit++;
				if (witness_list.length>5) $("#container").html("<p style='margin: 30px'>Loading witness "+witness+", "+nWit+" of "+witness_list.length+"</p>");
				callback(null)
			}
		})
		.fail (function(data){
			alert("Error fetching witnesses");
			CL.dataSettings.witness_list=[]; //reset to null
			finished_callback([]);
		});
	}, function (err) {
		finished_callback(results);  //results will have everything
	})
}
   
  getCurrentEditingProject = function (success_callback) {	
//   	  console.log("server2 "+TCMongoDB_services._dbUrl)
//  	  let project={"id": "chaucer", "name": "Chaucer Example Collation Editor 2", "managing_editor": "default",  "editors": ["default"], "witnesses": ["Ch","Hg", "El", "Ad3", "Bo1", "Bo2"],  "base_text": "Hg"};
    let searchParams = new URLSearchParams(window.location.search);
	TCMongoDB_services._dbUrl=searchParams.get('dbUrl');
	if (!TCMongoDB_services._dbUrl) { //coz of a bug in older browsers
		let ns=new URLSearchParams(window.location.search.substring(0,1)+'&'+window.location.search.substring(1));
		TCMongoDB_services._dbUrl=ns.get('dbUrl');
	}
   TCMongoDB_services.SITE_DOMAIN = 'https://textualcommunities.com:8443';  //reset when moving to server
//   console.log("server "+TCMongoDB_services._dbUrl)
   TCMongoDB_services._entity=searchParams.get('entity');
   TCMongoDB_services._community=searchParams.get('community');
   TCMongoDB_services._project={_id:TCMongoDB_services._community};
   TCMongoDB_services._mode=searchParams.get('mode');
   if (!TCMongoDB_services._mode) TCMongoDB_services._mode="reg";
   TCMongoDB_services._user=searchParams.get('user');  //hex id of user. We use this to check the person is authorized
			//we add in here, at Cats suggestion, hardwired values for the editor
			//now done in settings
//   CL.displaySettingsDetails.configs.push({"id": "expand_abbreviations", "label": "expand abbreviations","function": "expand_abbreviations","menu_pos": 5,"execution_pos": 1,"check_by_default": true, "apply_when": true});
//   CL.displaySettingsDetails.configs.push({"id": "show_punctuation","label": "show punctuation","function": "show_punctuation","menu_pos": 6,"execution_pos": 8,"check_by_default": false,"apply_when": true});
//   CL.displaySettingsDetails.configs.push({"id": "show_xml","label": "show xml","function": "show_xml", "menu_pos": 7,"execution_pos": 2,"check_by_default": false,"apply_when": true});
    _get_resource('ceconfig/?community=' + TCMongoDB_services._community, function (project) {
		project=JSON.parse(project);
		if (typeof project.witnesses[0]=='object') { //old style list of objects, not strings. Force back to 
			alert("The witness list is in an outdated format. Go to Manage->Collation->Choose Witnesses to change and resave the witness list to the new format");
			success_callback(null);
		} else {
			CL.dataSettings.witness_list=project.witnesses;
			CL.dataSettings.base_text = project.base_text;
			CL.context = TCMongoDB_services._entity;
			TCMongoDB_services.collationents=project.collationents;
			TCMongoDB_services.collationparallels=project.collationparallels;	
//			console.log("CL here in initialization") ;
			let cbproject={"id": TCMongoDB_services._community, "name": TCMongoDB_services._community, "managing_editor": "default",  "editors": ["default"], "witnesses": CL.dataSettings.witness_list,  "base_text": CL.dataSettings.base_text};
			success_callback(cbproject);
		}
    });
};

  getUnitData = function(context, witnesses, success_callback) {
    _load_witnesses(context, witnesses, function(results) {
      success_callback({results:results}, RG.calculate_lac_wits);
    });
  };

 getSiglumMap = function (id_list, result_callback, i, siglum_map) {
	var wit;
	if (typeof i === 'undefined') {
				i = 0;
				siglum_map = {};
	}
	if (i >= id_list.length) {
			//in tc: seems this function always exits here, so next call never gets activated
				return result_callback(siglum_map);
	}
		//for TC -- witid and siglum are always identical.  So we don't do the call to textrepo etc
		siglum_map[id_list[i]] = id_list[i];
		getSiglumMap(id_list, result_callback, ++i, siglum_map);
 };


  // if verse is passed, then verse rule; otherwise global
 updateRules = function(rules, verse, success_callback) {
	  updateRuleset([], [], rules, verse, success_callback);
 };

_delete_rules = function(for_deletion, verse, callback) {
	//we have an array of ids of records for deletion. Delete them in one go
	var url = TCMongoDB_services._dbUrl+'deleteRules/?entity='+verse+'&community='+TCMongoDB_services._community;
	var deleteNow=[];
	for (var i=0; i<for_deletion.length; i++) {deleteNow.push(for_deletion[i].id)};
	$.ajax({
		type: 'POST',
		url: url,
		data: JSON.stringify({delete: deleteNow}),
		accepts: 'application/json',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json'
	})
	.done (function(data){
//		console.log(data);
		callback(200);
	})
	.fail (function(data){
		callback(data.success)
	});
};
	
_add_rule_set = function (for_addition, verse, result_callback) {
	//create new array from for_addition, with CE field as a string; use model field to tell us what we are looking for
	var send_array=[];
	for (var i=0; i<for_addition.length; i++) {
		send_array.push({id: for_addition[i]._id, community: TCMongoDB_services._community, entity: verse, model: "regularization", scope: for_addition[i].scope, from: for_addition[i].t, to: for_addition[i].n, ce: JSON.stringify(for_addition[i]) });
	}
	var url = TCMongoDB_services._dbUrl+'putCERuleSet/?entity='+verse+'&community='+TCMongoDB_services._community;
	$.ajax({
		type: 'POST',
		url: url,
		data: JSON.stringify({ruleSet: send_array}),
		accepts: 'application/json',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json'
	})
	.done (function(data){
//		console.log(data);
		result_callback(200);
	})
	.fail (function(data){
		result_callback(data.success)
	});
};

_do_global_exceptions = function(for_global_exceptions, verse, callback) {
	var url = TCMongoDB_services._dbUrl+'addCEGlobalExceptions/?entity='+verse+'&community='+TCMongoDB_services._community;
	var exceptNow=[];
	for (var i=0; i<for_global_exceptions.length; i++) {exceptNow.push(for_global_exceptions[i]._id)};

	$.ajax({
		type: 'POST',
		url: url,
		data: JSON.stringify({exceptions: exceptNow}),
		accepts: 'application/json',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json'
	})
	.done (function(data){
//		console.log(data);
		callback(200);
	})
	.fail (function(data){
		callback(data.success)
	});
};

 _generate_uuid = function () {
		var new_uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
		});
		return new_uuid;
};

updateRuleset = function (for_deletion, for_global_exceptions, for_addition, verse, success_callback) {
	if (for_deletion.length>0) {
		_delete_rules(for_deletion, verse, function (result) {
				return updateRuleset([], for_global_exceptions, for_addition, verse, success_callback);
		});
	}  else if (for_addition.length>0) {
		CL.services.getUserInfo(function (user) {
			for (var m=0; m<for_addition.length; m++) {
				for_addition[m].community=TCMongoDB_services._community;
				for_addition[m]._meta = { _last_modified_time : new Date().getTime(), _last_modified_by : user._id, _last_modified_by_display : user.name };
				if (typeof for_addition[m]._id === 'undefined') {
					for_addition[m]._id = (for_addition[m].scope === 'always' ? 'global_' : ('verse_' + verse + '_')) + _generate_uuid();
				}
			}
			//this is where we write to the database for remote db
			_add_rule_set(for_addition, verse, function (result) {
			// we know how special we are and we always and only update a rule when we are adding an exception
				return updateRuleset([], for_global_exceptions, [], verse, success_callback);
		  });
		});
	} else if (for_global_exceptions.length>0) {
		_do_global_exceptions(for_global_exceptions, verse, function (result) {
			return updateRuleset([], [], [], verse, success_callback);
		});
	} else if (success_callback) {
		success_callback();
	}
}


getRulesByIds = function (ids, result_callback) {
	var url = TCMongoDB_services._dbUrl+'getRulesByIds/?community='+TCMongoDB_services._community;
	$.ajax({
		type: 'POST',
		url: url,
		data: JSON.stringify({findByIds: ids}),
		accepts: 'application/json',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json'
	})
	.done (function(data){
//		console.log(data);
		result_callback(data);
	})
	.fail (function(data){
		callback({success: 0})
	});
}
	


getRuleExceptions = function (entity, result_callback) {   //pull in all global rules for whuch this verse is an EXCEPTION; add them to rules arrau
		//shows cases where we have an exception so we can remove the exception (if we like!)
	var url = TCMongoDB_services._dbUrl + 'getRuleExceptions/?entity='+entity+'&community='+TCMongoDB_services._community+'&defeat_cache='+new Date().getTime();
	$.get(url, function(resource) {
		return result_callback(resource);
	});
}
	  
  _renameProperty = function (object, oldName, newName) {
	  if (object.hasOwnProperty(oldName)) {
		object[newName] = object[oldName];
		delete object[oldName];
	  }
  	return object;
 }

  _get_rules = function (entity, result_callback) {
		//go get all the rules from the database.  Check them here for exceptions
		var url = TCMongoDB_services._dbUrl + 'getRegularizationRules/?entity='+entity+'&community='+TCMongoDB_services._community+'&defeat_cache='+new Date().getTime();
//		console.log("inside get rules "+url);
		var rules=[];
		$.get(url, function(resource) {
			//need to insert check for exceptions here
			//two stages of JSON.parse...
				var resArr=JSON.parse(resource);
				for (var i=0; i<resArr.length; i++) {
					var thisRule=JSON.parse(resArr[i]);
					//rename properties _id and id
					_renameProperty(thisRule, "_id", "id");
					//filter out any with global exceptions for this verse
					if (!thisRule.hasOwnProperty('exceptions') || thisRule.exceptions.indexOf(entity) === -1) {
						rules.push(thisRule);
					}
				}
				result_callback(rules, 200);
			}, 'text').fail(function(o) {
				result_callback(null, o.status);
		});
	}
	
 	getRules = function (verse, result_callback, rules, resource_types, path_type, i) {
	//much simplified; We just go get all the rules from the datatase
//		console.log("getting the rules")
//		return result_callback(_get_rules(verse, result_callback)); fixed by Cat
		return _get_rules(verse, result_callback);
	}
 
  doCollation = function(verse, options, result_callback) {
    var url; 
//    console.log("collating")
    if (typeof options === "undefined") {
      options = {};
    }
    url = staticUrl + 'collationserver/';
    if (options.hasOwnProperty('accept')) {
      url += options.accept;
    }
    $.post(url, {
      options: JSON.stringify(options)
    }, function(data) {
      result_callback(data);
    }).fail(function(o) {
      result_callback(null);
    });
  };

 /* getAdjoiningUnit = function (verse, is_previous, result_callback) {
	    return result_callback(null);
	}; */

  applySettings = function (data, resultCallback) {
    var url;
    url = staticUrl + 'applysettings/';
    $.ajax({
      type: 'POST',
      url: url,
      data: {'data' :JSON.stringify(data)},
      success: function(data){
        resultCallback(data);
      }}).fail(function(o) {
        resultCallback(null);
    });
  };

saveCollation = function (entity, collation, confirm_message, overwrite_allowed, no_overwrite_message, result_callback) {
	//does it exist already?
//	console.log("in SaveCollation");
	var adjusted=false, savecollation=collation;
	//we add here: if this is approved collation we adjust to filter out -mod and -orig fake entries
		if (collation.status=="approved") {
			var savecollation=_remove_duprdgs(collation);
			adusted=true;
		}	
		var url = TCMongoDB_services._dbUrl + 'isAlreadyCollation/?entity='+entity+'&community='+TCMongoDB_services._community+'&status='+savecollation.status+'&defeat_cache='+new Date().getTime();
		$.get(url, function(status) {
				if (status.status) { //already got one
					if (overwrite_allowed) {
							var confirmed = confirm(confirm_message);
							if (confirmed === true) {
								var url = TCMongoDB_services._dbUrl + 'putCollation/?entity='+entity+'&community='+TCMongoDB_services._community+'&status='+savecollation.status+'&adjusted='+adjusted;
								var thisCollation={ce: JSON.stringify(savecollation)};
								$.ajax({
									type: 'POST', url: url, data: JSON.stringify({collation: thisCollation}), accepts: 'application/json', contentType: 'application/json; charset=utf-8', dataType: 'json'
								}).done (function(data){
									if (collation.status=="approved") {
										var dburl=TCMongoDB_services._dbUrl + 'markEntityCollated/?entity='+entity;
										$.post(dburl, function(data) {
										   _save_collation_apparatus(entity, result_callback, thisCollation);
		//									return result_callback(true);  //this is a hack, as for some reason previos call often fails???
										});
									 } else return result_callback(true);
								})
								.fail (function(data){
									return result_callback(false)
								})
							} else {
								return result_callback(false);
							}
					} else {
						return result_callback(false);
					}
				} else {  //not got one
					var url = TCMongoDB_services._dbUrl + 'putCollation/?entity='+entity+'&community='+TCMongoDB_services._community+'&status='+savecollation.status+'&adjusted='+adjusted;
					var thisCollation={ce: JSON.stringify(savecollation)};
					$.ajax({type: 'POST', url: url, data: JSON.stringify({collation: thisCollation}), accepts: 'application/json', contentType: 'application/json; charset=utf-8', dataType: 'json'})
					.done (function(data){
						if (collation.status=="approved") _save_collation_apparatus(entity, result_callback, thisCollation);
						else return result_callback(true);
					})
					.fail (function(data){return result_callback(false)});
				}
		});
}

_remove_duprdgs = function (collation) {
	var adjustCollation=collation;
//		return collation;  //remove on deploy
	var handkeys=Object.keys(adjustCollation.structure.hand_id_map);
	var hasMod=false;
	for (var i=0; i<handkeys.length && !hasMod; i++) {
		if (handkeys[i].includes("-mod") || handkeys[i].includes("-orig")) hasMod=true;
	}
	if (!hasMod) return adjustCollation; //no orig or mod readings in this line
	//ok. We do have orig and mod readings...

	for (let i=0; i<adjustCollation.structure.apparatus.length; i++) {
		for (let j=0; j<adjustCollation.structure.apparatus[i].readings.length; j++) {
			for (let k=0; k<adjustCollation.structure.apparatus[i].readings[j].witnesses.length; k++) {
				if (adjustCollation.structure.apparatus[i].readings[j].witnesses[k].includes("-mod")) {
					var mod_str=adjustCollation.structure.apparatus[i].readings[j].witnesses[k];
					var mod_pos=mod_str.indexOf("-mod");
					var wit_str= mod_str.slice(0, mod_pos);
					var orig_str=wit_str+"-orig";
					//check: if there is also a orig here, then we check if it is a duplicate
					for (let m=0; m<adjustCollation.structure.apparatus[i].readings[j].witnesses.length; m++) {
						if (adjustCollation.structure.apparatus[i].readings[j].witnesses[m]==orig_str) {
							let modtext="";
							let origtext="";
						//both mod and orig appear in the reading haha. Now check if the text values of each - k and m- are identical
						//here a complication. Reading MIGHT be in SR_text. Check if there is an entry for either in standoff_subreadings
							let modIsSub=false;
							let origIsSub=false;
							if (adjustCollation.structure.apparatus[i].readings[j].hasOwnProperty("standoff_subreadings")) {
								if (adjustCollation.structure.apparatus[i].readings[j].standoff_subreadings.includes(mod_str)) modIsSub=true;
								if (adjustCollation.structure.apparatus[i].readings[j].standoff_subreadings.includes(orig_str)) origIsSub=true;
							}
							//ok, length of text may vary in sub readings of course
							if (modIsSub) {
								for (let n=0; n<adjustCollation.structure.apparatus[i].readings[j].SR_text[mod_str].text.length; n++) {
								  modtext+=adjustCollation.structure.apparatus[i].readings[j].SR_text[mod_str].text[n][mod_str]["t"]
								  modtext+=" ";
								}
								if (!origIsSub) {
									for (let n=0; n<adjustCollation.structure.apparatus[i].readings[j].text.length; n++) {
										origtext+=adjustCollation.structure.apparatus[i].readings[j].text[n][orig_str]["t"];
										origtext+=" ";
									}	
								}
							} 
							if (origIsSub) {
								for (let n=0; n<adjustCollation.structure.apparatus[i].readings[j].SR_text[orig_str].text.length; n++) {
								  origtext+=adjustCollation.structure.apparatus[i].readings[j].SR_text[orig_str].text[n][orig_str]["t"]
								  origtext+=" "
								}
								if (!modIsSub) {
									for (let n=0; n<adjustCollation.structure.apparatus[i].readings[j].text.length; n++) {
										modtext+=adjustCollation.structure.apparatus[i].readings[j].text[n][mod_str]["t"];
										modtext+=" ";
									}	
								}
							}
							if (!modIsSub && !origIsSub) {
								for (let n=0; n<adjustCollation.structure.apparatus[i].readings[j].text.length; n++) {
									modtext+=adjustCollation.structure.apparatus[i].readings[j].text[n][mod_str]["t"];
									origtext+=adjustCollation.structure.apparatus[i].readings[j].text[n][orig_str]["t"];
									modtext+=" ";
									origtext+=" ";
								}
							}
							if (modtext==origtext) { //we have a duplicate! remove for each text...; adjust name of each mod element; remove orig element
								if (modIsSub) {var nrdgs=adjustCollation.structure.apparatus[i].readings[j].SR_text[mod_str].text.length}
								else {var nrdgs=adjustCollation.structure.apparatus[i].readings[j].text.length}
								for (let n=0; n<nrdgs; n++) { 
									if (modIsSub) {
										if (n==0) Object.defineProperty(adjustCollation.structure.apparatus[i].readings[j].SR_text, wit_str, Object.getOwnPropertyDescriptor(adjustCollation.structure.apparatus[i].readings[j].SR_text, mod_str));
										Object.defineProperty(adjustCollation.structure.apparatus[i].readings[j].SR_text[wit_str].text[n], wit_str, Object.getOwnPropertyDescriptor(adjustCollation.structure.apparatus[i].readings[j].SR_text[wit_str].text[n], mod_str));
										delete adjustCollation.structure.apparatus[i].readings[j].SR_text[wit_str].text[n][mod_str];
										adjustCollation.structure.apparatus[i].readings[j].SR_text[wit_str].text[n].reading[0]=wit_str;
										if (n==nrdgs-1) delete adjustCollation.structure.apparatus[i].readings[j].SR_text[mod_str];
									} 
									if (!modIsSub) {
										Object.defineProperty(adjustCollation.structure.apparatus[i].readings[j].text[n], wit_str, Object.getOwnPropertyDescriptor(adjustCollation.structure.apparatus[i].readings[j].text[n], mod_str));
										delete adjustCollation.structure.apparatus[i].readings[j].text[n][mod_str];
									} 
									if (origIsSub) {
										if (n==0) delete adjustCollation.structure.apparatus[i].readings[j].SR_text[orig_str]
									} 
									if (!origIsSub) {
										delete adjustCollation.structure.apparatus[i].readings[j].text[n][orig_str];
									}
									if (!modIsSub) {
										for (let p=0; p<adjustCollation.structure.apparatus[i].readings[j].text[n].reading.length; p++) {
											if (adjustCollation.structure.apparatus[i].readings[j].text[n].reading[p]==mod_str) {
												adjustCollation.structure.apparatus[i].readings[j].text[n].reading[p]=wit_str;
											}
											if (adjustCollation.structure.apparatus[i].readings[j].text[n].reading[p]==orig_str) {
												adjustCollation.structure.apparatus[i].readings[j].text[n].reading.splice(p, 1);
												p--;
											}
										}
									} else {  // adjust in standoff array
										for (let p=0; p<adjustCollation.structure.apparatus[i].readings[j].standoff_subreadings.length; p++) {
											if (adjustCollation.structure.apparatus[i].readings[j].standoff_subreadings[p]==mod_str) {
												adjustCollation.structure.apparatus[i].readings[j].standoff_subreadings[p]=wit_str;
											}
											if (adjustCollation.structure.apparatus[i].readings[j].standoff_subreadings[p]==orig_str) {
												adjustCollation.structure.apparatus[i].readings[j].standoff_subreadings.splice(p, 1);
												p--;
											}
										}
									}
								}
								for (let n=0; n<adjustCollation.structure.apparatus[i].readings[j].witnesses.length; n++) {
									if (adjustCollation.structure.apparatus[i].readings[j].witnesses[n]==mod_str) {
										adjustCollation.structure.apparatus[i].readings[j].witnesses[n]=wit_str;
									}
									if (adjustCollation.structure.apparatus[i].readings[j].witnesses[n]==orig_str) {
										adjustCollation.structure.apparatus[i].readings[j].witnesses.splice(n, 1);
										n--;
									}
								}
							}
						}
					}
				}
			}
		}
	}
	return adjustCollation;
}

deleteAllRules = function (callback) { //delete everything set for this block
	//we add a check that this is a project leader to stop mischief
	var url = TCMongoDB_services._dbUrl+'deleteAllRules/?entity='+TCMongoDB_services._entity+'&community='+TCMongoDB_services._community+"&user="+TCMongoDB_services._user;
	$.ajax({
		type: 'POST',
		url: url,
	})
	.done (function(data){
		//unmark this entity as collated
		var dburl=TCMongoDB_services._dbUrl + 'unMarkEntityCollated/?entity='+TCMongoDB_services._entity;
		$.post(dburl, function(data2) {
			callback(data);
		});
	})
	.fail (function(data){
		callback(data)
	});
}

_save_collation_apparatus = function(entity, result_callback, myCollation) {
	//tc adds this: when we approved the apparatus we write it to the collation db
//	console.log("in Save_collation_apparatus ");
	 var url =  staticUrl + 'apparatus';
	 let approved = JSON.parse(myCollation.ce);
	 let settings = JSON.parse(CL.getExporterSettings());
	 if (!settings.hasOwnProperty('options')) {
		settings.options = {};
	 }
	 settings.options.rule_classes = CL.ruleClasses;
	 settings.options.witness_decorators = CL.project.witnessDecorators;
	 let  data = {settings: JSON.stringify(settings), format: 'positive_xml', data: JSON.stringify([{'context': CL.context, 'structure': approved.structure}])};
	 $.post(url, data).then(function (response) {
//		console.log(response);
		var dburl=TCMongoDB_services._dbUrl + 'putCollation/?entity='+entity+'&community='+TCMongoDB_services._community+'&status=xml/positive&adjusted=true';
		var thisCollation={ce: response};
		$.ajax({
			type: 'POST', url: dburl, data: JSON.stringify({collation: thisCollation}), accepts: 'application/json', contentType: 'application/json; charset=utf-8', dataType: 'json'
		}).done (function(data){
			let  data2 = {settings: JSON.stringify(settings), format: 'negative_xml', data: JSON.stringify([{'context': CL.context, 'structure': approved.structure}])};
			//now do the same for negative apparatus
			$.post(url, data2).then(function (response2) {
				var dburl=TCMongoDB_services._dbUrl + 'putCollation/?entity='+entity+'&community='+TCMongoDB_services._community+'&status=xml/negative';
				var thisCollation={ce: response2};
				$.ajax({
					type: 'POST', url: dburl, data: JSON.stringify({collation: thisCollation}), accepts: 'application/json', contentType: 'application/json; charset=utf-8', dataType: 'json'
				}).done (function(data){
					//finally, mark that a collation exists for this entity
					var dburl=TCMongoDB_services._dbUrl + 'markEntityCollated/?entity='+entity;
					$.post(dburl, function(data) {
						return result_callback(true);
					});
				});
			});
		});
	});
}
	
getSavedCollations = function (verse, user_id, result_callback, collations, users, i) {
	let url = TCMongoDB_services._dbUrl+'getSavedCollations/?entity='+TCMongoDB_services._entity;
	$.ajax({
		type: 'POST',
		url: url,
	})
	.done (function(collations){
		result_callback(collations);
	})
	.fail (function(data){
		callback(data)
	});
}


  getUserInfoByIds = function(ids, success_callback) {
    var user_infos, i;
    user_infos = {};
    for (i = 0; i < ids.length; ++i) {
      if (ids[i] === _local_user.id) {
        user_infos[ids[i]] = _local_user;
      } else {
        user_infos[ids[i]] = {
          _id: ids[i],
          name: ids[i]
        };
      }
    }
    success_callback(user_infos);
  };
   
loadSavedCollation = function (id, result_callback) {
	//annoyingly.. have to clean up this id...
	//add link in header to return to collation
	if (id.indexOf(TCMongoDB_services._community+"/")!=0) {
		id=id.replace(TCMongoDB_services._community+":", TCMongoDB_services._community+"/"+TCMongoDB_services._community+":").replace("_default_undefined","").replace("_","/");
		id=id.replace("_default_"+TCMongoDB_services._community,"");
		id=id.replace("_undefined","");
		id=id.replace("_"+TCMongoDB_services._community,"");
	}
	var url = TCMongoDB_services._dbUrl + 'loadSavedCollation/?id='+id+'&defeat_cache='+new Date().getTime();
	$.get(url, function(result) {
		if (result_callback) result_callback(result.status ? JSON.parse(result.result):null);
	});
 };

  
 getSavedStageIds = function (entity, result_callback) {
	//we just use this to confirm there is a saved collation, which gets opened and read in later
	var r=null, s=null, o=null, a=null;
	var url=TCMongoDB_services._dbUrl +'isAlreadyCollation/?entity='+entity+'&community='+TCMongoDB_services._community+'&status=regularised';
	$.get(url, function(status) {
		var resource_type = TCMongoDB_services._community+'/'+entity+'/regularised';
		r = (status.status) ? resource_type : null;
		url=TCMongoDB_services._dbUrl +'isAlreadyCollation/?entity='+entity+'&community='+TCMongoDB_services._community+'&status=set';
		$.get(url, function(status) {
			resource_type =  TCMongoDB_services._community+'/'+entity+'/set';
			s = (status.status) ? resource_type : null;
			url=TCMongoDB_services._dbUrl +'isAlreadyCollation/?entity='+entity+'&community='+TCMongoDB_services._community+'&status=ordered';
			$.get(url, function(status) {
				resource_type =  TCMongoDB_services._community+'/'+entity+'/ordered';
				o = (status.status) ? resource_type : null;
				url=TCMongoDB_services._dbUrl +'isAlreadyCollation/?entity='+entity+'&community='+TCMongoDB_services._community+'&status=approved';
				$.get(url, function(status) {
					resource_type =  TCMongoDB_services._community+'/'+entity+'/approved';
					a = (status.status) ? resource_type : null;
					result_callback(r, s, o, a);
				});
			});
		})
	})
 } 



  //internal service functions/values
  _local_user = {
    id: 'default',
  };

  getApparatusForContext = function() {
//  	  console.log("in get app for context")
    spinner.showLoadingOverlay();
    let url= TCMongoDB_services._dbUrl+'getCollations?community='+TCMongoDB_services._community;
    //put / in entity...
    let myEntity=TCMongoDB_services._entity.replace(TCMongoDB_services._community+":",TCMongoDB_services._community+"/");
    $.ajax({
      	url:url,
      	type: 'POST',
      	data: JSON.stringify({ranges: [{start: myEntity, end:myEntity}], collentities: [], output:'tei/xml', partorall:'part'}),
		accepts: 'application/json',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json'
	}).then(function (response) {
	  var blob, filename, downloadUrl, hiddenLink;
	  let prettyXML=_prettyfiXML(response[0].collation);
	  blob = new Blob([prettyXML], {'type': 'text/plain'});
	  filename = CL.context + '_apparatus.xml';
	  downloadUrl = window.URL.createObjectURL(blob);
	  hiddenLink = document.createElement('a');
	  hiddenLink.style.display = 'none';
	  hiddenLink.href = downloadUrl;
	  hiddenLink.download = filename;
	  document.body.appendChild(hiddenLink);
	  hiddenLink.click();
	  window.URL.revokeObjectURL(downloadUrl);
	  spinner.removeLoadingOverlay();
  }).fail(function (response) {
	alert('This unit cannot be exported. First try reapproving the unit. If the problem persists please ' +
		  'recollate the unit from the collation home page.');
     spinner.removeLoadingOverlay();
  });
}

 _prettyfiXML = function(inApp) {
	inApp=inApp.replace(/<TEI/g, "\r<TEI");
	inApp=inApp.replace(/<ab xml:id/g, "\r    <ab n");
	inApp=inApp.replace(/<app /g, "\r         <app ");
	inApp=inApp.replace(/<\/app>/g, "\r        <\/app>");
	inApp=inApp.replace(/<\/ab>/g, "\r    <\/ab>\r");
	inApp=inApp.replace(/<lem /g, "\r            <lem ");
	inApp=inApp.replace(/<rdg /g, "\r            <rdg ");
	return inApp;
}

 getAdjoiningUnit = function(context, isPrevious, callback) {
	let searchEntity=TCMongoDB_services._entity.replace(TCMongoDB_services._community+":", "");
	//from TCMongoDB_services.collationents
	
	if ((typeof TCMongoDB_services.collationents!="undefined") && TCMongoDB_services.collationents.length>0 && TCMongoDB_services.collationents.filter(entity=>entity==searchEntity).length>0) {
		const index = TCMongoDB_services.collationents.indexOf(searchEntity);
		if (isPrevious && index>0) {
			$("#previous_verse").on("click", function() {
				window.location.href=staticUrl+"?dbUrl="+TCMongoDB_services._dbUrl+"&entity="+TCMongoDB_services._community+":"+TCMongoDB_services.collationents[index-1]+"&community="+TCMongoDB_services._community+"&user="+TCMongoDB_services._user+"&mode=reg";
			} );
			$("#previous_verse").hover(
			  function() {
				// Function to execute on mouseenter
				$(this).css('cursor', 'pointer'); // Change cursor to pointer
			  },
			  function() {
				// Function to execute on mouseleave
				$(this).css('cursor', 'default'); // Change cursor back to default
			  }
			);
		} else if (!isPrevious && index>-1 && index<TCMongoDB_services.collationents.length) {
			$("#next_verse").on("click", function() {
				window.location.href=staticUrl+"?dbUrl="+TCMongoDB_services._dbUrl+"&entity="+TCMongoDB_services._community+":"+TCMongoDB_services.collationents[index+1]+"&community="+TCMongoDB_services._community+"&user="+TCMongoDB_services._user+"&mode=reg";
			} );
			$("#next_verse").hover(
			  function() {
				// Function to execute on mouseenter
				$(this).css('cursor', 'pointer'); // Change cursor to pointer
			  },
			  function() {
				// Function to execute on mouseleave
				$(this).css('cursor', 'default'); // Change cursor back to default
			  }
			);
		} else if (isPrevious && index==0) {
			$("#previous_verse").html('<td class="nav" id="next_verse">	</td>')
		}
	} else {
		$("#previous_verse").html("")
		$("#next_verse").html("")		
	}
}

witnessSort = function(orig) {
	let dest=[];
//	console.log("in witness sort");
	orig.sort();  //put in alpha order first
	//put base first..
	if (orig.filter(text=>text==CL.dataSettings.base_text).length) {
		dest.push(CL.dataSettings.base_text);
		for (let i=0; i<orig.length; i++) {
			if (orig[i]!=CL.dataSettings.base_text) dest.push(orig[i]);
		}
		for (let i=0; i<orig.length; i++) {
			orig[i]=dest[i];
		}
	}
}

extraFooterButtons = {
  "regularised": [
    {
      "id": "deleteAllRules",
      "label": "delete all rules"
    }
  ]
};

 addExtraFooterFunctions = function () {
 	//really a hack sticking this here. But hey it works
	$("#project_name").after("&nbsp;<h1 id='moveToLoad' style='float:left; padding-left:20px' title='Click here to add or delete witnesses from a collation'>&nbsp;&nbsp;Load Saved Collations</h1>")  
	$("#moveToLoad").on("click", function() {
		//stuff goes here
		spinner.showLoadingOverlay();
		getSavedCollations(TCMongoDB_services._entity, undefined, function(collations) {
        getCurrentEditingProject(function(project) {
          //this fails because the page is not loaded...
          $("#container").html('<div id="verse_selection">\r<div id="saved_collations_div"></div>\r</div>');
          $("#footer").html('<input class="pure-button right_foot" id="collation_settings" type="button" value="Change Collation Settings">');
          CL._showSavedVersions(collations, project.witnesses, TCMongoDB_services._entity);
          
 //  
  			$("#project_name").after("&nbsp;<h1 id='moveToCollate' style='float:left; padding-left:20px'>&nbsp;&nbsp;Return to Collation</h1>")  
        	$("#moveToCollate").hover(
			  function() {
				// Function to execute on mouseenter
				$(this).css('cursor', 'pointer'); // Change cursor to pointer
			  },
			  function() {
				// Function to execute on mouseleave
				$(this).css('cursor', 'default'); // Change cursor back to default
			  }
			);
			$("#moveToCollate").on("click", function() {
				window.location.href=staticUrl+"?dbUrl="+TCMongoDB_services._dbUrl+"&entity="+TCMongoDB_services._entity+"&community="+TCMongoDB_services._community+"&user="+TCMongoDB_services._user+"&mode=reg";
			});
        });
      });
	});
	$("#moveToLoad").hover(
	  function() {
		// Function to execute on mouseenter
		$(this).css('cursor', 'pointer'); // Change cursor to pointer
	  },
	  function() {
		// Function to execute on mouseleave
		$(this).css('cursor', 'default'); // Change cursor back to default
	  }
	);
	$("#deleteAllRules").click(function() {
	    var ok=confirm("You are asking to remove all regularizations, variant settings and collations for \""+TCMongoDB_services._entity+"\". Are you sure? This cannot be undone.");
        if (ok) {
			deleteAllRules(function(){
//				console.log("all gone")
			});
		}
	});
 };

return {
    getCurrentEditingProject: getCurrentEditingProject,
    initialiseEditor: initialiseEditor,
    getUnitData: getUnitData,
    getSiglumMap: getSiglumMap,
    getRulesByIds: getRulesByIds,
    updateRules: updateRules,
    updateRuleset: updateRuleset,
    getRules: getRules,
    doCollation: doCollation,
    getAdjoiningUnit: getAdjoiningUnit,
    supportedRuleScopes: supportedRuleScopes,
    getUserInfo: getUserInfo,
    getRuleExceptions: getRuleExceptions,
    saveCollation: saveCollation,
    getSavedCollations: getSavedCollations,
    getUserInfoByIds: getUserInfoByIds,
    loadSavedCollation: loadSavedCollation,
    getSavedStageIds: getSavedStageIds,
    getApparatusForContext: getApparatusForContext,
    applySettings: applySettings,
    allowWitnessChangesInSavedCollations: allowWitnessChangesInSavedCollations,
    extraFooterButtons: extraFooterButtons,
    addExtraFooterFunctions: addExtraFooterFunctions,
    witnessSort: witnessSort
  };

} () );
