//source: http://bl.ocks.org/lorenzopub/820bec1dafa6a5cd11aa23c1268edcbf
function wordCloud(selector) {

    var fill = d3.scale.category20();

    //Construct the word cloud's SVG element
    var svg = d3.select(selector).append("svg")
        	.attr("width", 1000)
        	.attr("height", 600)
        	.append("g")
        	.attr("transform", "translate(500,300)");


    //Draw the word cloud
    function draw(words) {
        var cloud = svg.selectAll("g text")
                        .data(words, function(d) { return d.text; })

        //Entering words
        cloud.enter()
            	.append("text")
            	.style("font-family", "Impact")
            	.style("fill", function(d, i) { return fill(i); })
            	.attr("text-anchor", "middle")
            	.attr('font-size', 1)
            	.text(function(d) { return d.text; });

        //Entering and existing words
        cloud.transition()
                .duration(600)
                .style("font-size", function(d) { return d.size + "px"; })
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .style("fill-opacity", 1);

        //Exiting words
        cloud.exit()
            .transition()
                .duration(200)
                .style('fill-opacity', 1e-6)
                .attr('font-size', 1)
                .remove();
    }

    //Use the module pattern to encapsulate the visualisation code. We'll
    // expose only the parts that need to be public.
    return {

        //Recompute the word cloud for a new set of words. This method will
        // asycnhronously call draw when the layout has been computed.
        //The outside world will need to call this function, so make it part
        // of the wordCloud return value.
        update: function(words, spiral) {
            d3.layout.cloud().size([1000, 600])
                    .words(words)
                	//.padding(5)
                	.rotate(function() { return ~~(Math.random() * 2) * 90; })
                	.font("Impact")
                	.fontSize(function(d) { return d.size; })
                	.spiral(spiral)
                	.on("end", draw)
                	.start();
        }
    }
}

var coca_dataset = [
      	"engineering", "architect", "groups", "we", "designs", "games", "technology",
      	"collaborative", "creativity", "test", "ideas", "Corpus-Callosum", "fun",
      	"organization", "expressions", "cool", "colorful", "artistic"].map(function(d) {
      	return {text: d, size: 18 + Math.random() * 60};
    });

var dataset = coca_dataset;

var question_ids = new Array();
var person_map = new Map();
var current_data = "CoCa";

function get_responses(callback) {
    var api_key = "e291591d92b386bf924906768d88859e0a80e358";
    var UID = "BvNrRV";
    var URL = "https://api.typeform.com/v1/form/" + UID + "?key=" + api_key + "&completed=true";

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }

    xmlHttp.open("GET", URL, true); // true for asynchronous 
    xmlHttp.send();
    
    return xmlHttp.responseText;
}

function store_responses(json_response) {
    var response = JSON.parse(json_response);
    console.log(response);
    console.log(response.questions);
    console.log(response.responses);
    for(i in response.questions) {
        question_ids.push(response.questions[i].id);
    }

    for(i in response.responses) {
        var a_response = '';
        var name = '';
        answers = response.responses[i].answers;
        var new_response = true;
        for(j in question_ids) {
        	if (j == 0) {
        		name = answers[question_ids[j]];
        	} else if (j == 1) {
        		name += "-" + answers[question_ids[j]];
                if (person_map.has(name.toLowerCase())) {
                    new_response = false;
                    break;
                }
        		//a_response += name;
        	} else if (j == 10) {
                var answer = answers[question_ids[j]].replace(/[!\,:;\?]/g, '');
                a_response += answer + " ";
            } else {
        		answer = answers[question_ids[j]].replace(/\s/g, '-');
                if (j == 10 && answer == "United-States-of-America") {
                    answer = "U.S."
                }
        		a_response += answer + " ";
        	}
        }
        if (new_response) {
            var new_data = new Array();
            // set name to the biggest font
            new_data[0] = {text: name, size: 60};

            a_response = a_response.substr(0, a_response.length - 1);
            new_data = new_data.concat(getWords(a_response));
        
            person_map.set(name.toLowerCase(), new_data);
        }
    }
    console.log(person_map);
}

var spiral = "archimedean";

//Prepare one of the sample sentences by removing punctuation,
// creating an array of words and computing a random size attribute.
function getWords(words) {
    return words
            .replace(/[!\,:;\?]/g, '')
            .split(' ')
            .map(function(d) {
                return {text: d, size: 18 + Math.random() * 60};
            })
}

//This method tells the word cloud to redraw with a new set of words.
//There's a recursive function to keep the word cloud animating (every 3 secs).
//It'll also terminate the old thread if a new one is called.
function showNewWords(data, vis, spiral, new_thread) {
    vis.update(data, spiral)
    setTimeout(function() { 
    	if (new_thread || total_thread < 2) {
    		showNewWords(data, vis, spiral, false);
    	} else {
    		total_thread -= 1;
    	}
    }, 3000)
}

//Create a new instance of the word cloud visualisation.
var myWordCloud = wordCloud('#vis');

//Start cycling through the demo data
total_thread = 1;
showNewWords(dataset, myWordCloud, spiral, true);
get_responses(store_responses);