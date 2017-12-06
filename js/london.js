/**
 * On page load, clean local storage and 
 * load services information for menu
 */
document.addEventListener('DOMContentLoaded', function() {
    localStorage.clear();
    getServices();
}, false);

/*
 * Clean messafe container
 */
function cleanMessageContainer() {
	//clean container
	var container = document.getElementById('informationContent');
  	container.innerHTML = "";
  	var messsage = document.createElement('div');
	messsage.setAttribute("id", "informationMessage");
	container.appendChild(messsage);
}
/*
 * Display message on screen
 */
function displayMessage(value, loc) {
  var txt = document.createElement('h2');

  switch(value) {
  	case 'loading':
        txt.innerHTML = "Loading...";
        break;
    case 'TranportsError':
        txt.innerHTML = "Unable to get Transports information.";
        break;
    case 'noDisruption':
        txt.innerHTML = "No service disruptions.";
        break;
	case 'disruptions':
        txt.innerHTML = "Service currently suffering disruptions.";
        break;  
    case 'bikeNotfound':
        txt.innerHTML = "No bike points found for " + loc;
        break;       
  }

  cleanMessageContainer();
  var headerMessage = document.getElementById('informationMessage');
  headerMessage.appendChild(txt);
  $("#informationMessage").hide().fadeIn(1000);
}

/*
 * Display information about the services on side menu
 * For that, we need to retrieve information from the GOV.UK API
 * Add information to the sidemenu
 * At the end, add Cycle Hire Option
 */
function getServices() {
	fetch("https://api.tfl.gov.uk/Line/Mode/tube,overground,dlr/Status?detail=true")
		.then(function(r) {
			//console.log(r);
			return r.json();
		})
		.then(function(r) {
			//console.log(r);

			//group objects by modeName
			return groupObjects(r,'modeName');
		})
		.then(function(r) {
			//console.log(r);

			//sort elements by modeName by putting it in array
			var sortable = [];
			for (var transport in r) {
			    sortable.push([transport, r[transport]]);
			}
			sortable.sort(function(a, b) {
				if (a[0].toUpperCase() < b[0].toUpperCase()) {
				    return -1;
				}
				if (a[0].toUpperCase() > b[0].toUpperCase()) {
				    return 1;
				}
				// names must be equal
				return 0;
			});
			return sortable;
		})
		.then(function(r) {
			//console.log(r);

			//order objects in each modeName
			for (var i=0; i < r.length; i++) {
				r[i][1].sort(function(a, b) {
					var nameA = a.name.toUpperCase(); // ignore upper and lowercase
					var nameB = b.name.toUpperCase(); // ignore upper and lowercase
					if (nameA < nameB) {
					    return -1;
					}
					if (nameA > nameB) {
					    return 1;
					}

					// names must be equal
					return 0;
				});
			}
			return r;
		})
		.then(function(r) {
			console.log(r);

			var menu = document.getElementById("menu");
			//add elements to menu
			for (var i=0; i < r.length; i++) {
				for (var j=0; j < r[i][1].length; j++) {
					//create menu option
					let line = document.createElement('li');
					line.classList.add("nav-item");


					//add name to menu option and make it clickable
    				line.innerHTML = `<button type="button" class="btn btn-link" onclick="addInformation('${r[i][1][j].name}');return false;">${r[i][1][j].name}</button>`;
    				//add night icon
    				if (r[i][1][j].serviceTypes.filter(checkServiceType).length > 0)
    					line.innerHTML += " <i class='fa fa-moon-o' aria-hidden='true'></i>";
    				//check exhistence of disruptions
					let disruptions = r[i][1][j].lineStatuses.filter(checkDisruptions);
					//console.log(disruptions);
    				//add service disruptions icon
    				if (disruptions.length > 0) {
    					line.innerHTML += " <i class='fa fa-exclamation-triangle' aria-hidden='true'></i>"; 
    					//save disruptions in local storage for easy access
    					localStorage.setItem(r[i][1][j].name, JSON.stringify(disruptions));
    				}

    				menu.appendChild(line);
				}
			}

		})
		.then(function() {
			addCycleHireOption();
		}),
		function (err) {
			displayMessage(TranportsError);
    };
}

/*
 * Add Cycle Hire option to menu options
 */
function addCycleHireOption() {
	var menu = document.getElementById("menu");
	var line = document.createElement('li');
	line.classList.add("nav-item");
    line.innerHTML = '<button type="button" class="btn btn-link" onclick="cycleSearchOptions();return false;">Cycle Hire</button>';
    menu.appendChild(line);
}

/*
 * Group object element by property key
 */
function groupObjects(element, key) {
	return element.reduce(function(new_element, index) {
		(new_element[index[key]] = new_element[index[key]] || []).push(index);
			return new_element;
		}, {});
	}


function checkServiceType(service) {
	return service.name === "Night";
}

function checkDisruptions(lineStatuses) {
	return lineStatuses.statusSeverity != 10;
}

/*
 * Add disruption information on message box
 */
function addInformation(name) {
	if(localStorage.getItem(name).length <= 2 ) {
		displayMessage("noDisruption");
	}
	else {
		displayMessage("disruptions");
	    disruptions = JSON.parse(localStorage.getItem(name));
	    addDisruptionReasons(disruptions);
	}
}

/*
 * List dirsuption reasons
 */
function addDisruptionReasons (disruptions) {
	var headerMessage = document.getElementById('informationMessage');
	var listReasons = document.createElement('ul');

	console.log(disruptions);

	for (var i=0; i < disruptions.length; i++) {
		let reason = document.createElement('li');
		reason.innerHTML = `${disruptions[i].reason}`;
		//console.log(disruptions[i]);
		listReasons.appendChild(reason);
	}

	headerMessage.appendChild(listReasons);
	$("#informationMessage").hide().fadeIn(1000);
}

/*
 * Display Cycle Search Options
 */
function cycleSearchOptions() {
	//clean container
	cleanMessageContainer();

	var container = document.getElementById('informationContent');
  	var messsage = document.getElementById("informationMessage");

	var searchBox = document.createElement('div');
	searchBox.classList.add("input-group");
	searchBox.setAttribute("id", "search");
	searchBox.innerHTML = '<input type="text" class="form-control" placeholder="Search for..." id="query">';
	var button = document.createElement('span');
	button.classList.add("input-group-btn");
	button.innerHTML = '<button class="btn btn-customize" type="button">GO</button>';
	searchBox.appendChild(button);
	container.insertBefore(searchBox, messsage);

	var result = document.createElement('div');
	result.setAttribute("id", "result");
  	container.insertBefore(result, messsage);

  	//add search box listeners
  	document.getElementById('search').getElementsByTagName('button')[0].addEventListener('click', function() {
		getBikePoints(getInput());
	});

	document.getElementById('search').getElementsByTagName('input')[0].addEventListener('keypress', function(e) {
		if(e.keyCode === 13) {
			getBikePoints(getInput());
		}
	});
}

/*
 * Get user input on search box
 */
function getInput() {
	return document.getElementById('search').getElementsByTagName('input')[0].value;
}

/*
 * Get Bike Points from storage or thought the API 
 * and display information on screen
 */
function getBikePoints(name) {
	var bikePoints = searchBikeLocationInStorage(name);
	console.log(bikePoints);
	if (!bikePoints) {
		bikePoints = getBikePointsFromAPI(name);
		return;
	}

	var result = document.getElementById("result");
	result.innerHTML = "";
	var listResults = document.createElement("ul");

	for (var i=0; i < bikePoints.length; i++) {
		let line = document.createElement('li');
		let bikeId = bikePoints[i].id.split('_')[1];
		line.innerHTML = bikeId + ` ${bikePoints[i].commonName} (${bikePoints[i].lat},${bikePoints[i].lon})`;
		listResults.appendChild(line);
	}

	result.appendChild(listResults);
}

/*
 * Check if bike information is on local storage
 */
function searchBikeLocationInStorage(name) {
	if(localStorage.getItem('bikes') != null) {
	    var bikeInformation = JSON.parse(localStorage.getItem('bikes'));
	    console.log(bikeInformation);

	    if (bikeInformation.hasOwnProperty(name)) {
			return bikeInformation[name];
		}

	}
	return null;
}

/*
 * Save bike information on local storage
 */
function saveBikeLocationInStorage(name, location) {
	var bikeInformation = {'bikes': {} };
	if(localStorage.getItem('bikes') != null) {
	    bikeInformation = JSON.parse(localStorage.getItem('bikes'));
	}
	bikeInformation[name] = location;
	localStorage.setItem('bikes',JSON.stringify(bikeInformation));
}

/*
 * Get bike information from API and display information on screen
 */
function getBikePointsFromAPI(name) {
	fetch("https://api.tfl.gov.uk/BikePoint/Search?query=" + name)
	.then(function(r) {
		//console.log(r);
		return r.json();
	})
	.then(function(r) {
		console.log(r);

		if (r.length==0) {
			displayMessage("bikeNotfound", name);
		}
		else {
			var result = document.getElementById("result");
			result.innerHTML = "";
			var listResults = document.createElement("ul");

			for (var i=0; i < r.length; i++) {
				let line = document.createElement('li');
				let bikeId = r[i].id.split('_')[1];
				line.innerHTML = bikeId + ` ${r[i].commonName} (${r[i].lat},${r[i].lon})`;
				listResults.appendChild(line);
			}

			result.appendChild(listResults);
		}
		return r;
	})
	.then(function(r) {
		saveBikeLocationInStorage(name, r);
	}),
	function (err) {
		displayMessage("bikeNotfound", name);
    };
}