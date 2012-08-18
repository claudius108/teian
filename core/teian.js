/*
 * Teian - Web adnotator
 * By Claudius Teodorescu
 * Licensed under LGPL.
 */

window.teian = {
	"name" : "teian",
	"version" : "2.3.5",
	"compatibility" : {
		"annotator-types" : "0.4"
	},
	"utils" : {
		"sOperationType" : "add"
	},
	"annotator" : [ function(oAnnotator, sAnnotatorType, eventObject) {
		var utils = teian.utils;
		var sessionParameters = teian.sessionParameters;
		teian.utils.restoreSelection();
		var oSelection = rangy.getSelection(), sOperationType = utils.sOperationType;
		if (oSelection == "" && "insert insert-parametrized".indexOf(sAnnotatorType) == -1) {
			alert(teian._errors[0]);
			return;
		}
		
		var userSelectedParentNode = (oSelection.anchorNode.nodeName == '#text') ? oSelection.anchorNode.parentNode : oSelection.anchorNode;
		var userSelectedFormerParentNode = null;		
		var calculatedParentNode = null;
		var calculatedPrecedingSiblingNode = null;
		
		function calculateParentNode(currentParentNode) {
		  //case when user selects outside the XML content
		  if (currentParentNode.id == 'teian-content') {
		    calculatedParentNode = currentParentNode.firstElementChild;
		    if (utils.clickY < utils.contenContainerHalfHeight) {
		      userSelectedFormerParentNode = (calculatedParentNode.firstElementChild != null) ? calculatedParentNode.firstElementChild : null;
		      return;		      
		    } else {
		      return;
		    }		    
		  }
		  //case when user selects inside the XML content		  
		  if (oAnnotator.sPossibleParents.indexOf(", " + currentParentNode.nodeName + ",") == -1) {
		    userSelectedFormerParentNode = currentParentNode;
		    return calculateParentNode(currentParentNode.parentNode, currentParentNode);
		  } else {
		    calculatedParentNode = currentParentNode;
		  }
		}
		
		function calculatePrecedingSiblingNode(userSelectedFormerParentNode, possiblePrecedingSiblingNodesNumber, possiblePrecedingSiblingNodes) {
		  var startNodeIndex = 0, middleNodeIndex;
		  while (startNodeIndex <= possiblePrecedingSiblingNodesNumber) { 
		      if (possiblePrecedingSiblingNodes[(middleNodeIndex = (startNodeIndex + possiblePrecedingSiblingNodesNumber) >> 1)].compareDocumentPosition(userSelectedFormerParentNode) & 4) {
			startNodeIndex = middleNodeIndex + 1;
		      } else {
			possiblePrecedingSiblingNodesNumber = (userSelectedFormerParentNode === possiblePrecedingSiblingNodes[middleNodeIndex]) ? -2 : middleNodeIndex - 1;
		      }
		  }
		  return (possiblePrecedingSiblingNodesNumber == -2) ? middleNodeIndex : -1;

		}

		//calculate the parent node based on annotator schema
		calculateParentNode(userSelectedParentNode);
		
		//calculate the preceding sibling node based on annotator schema
		if (userSelectedFormerParentNode != null) {
		  var possiblePrecedingSiblingNodes = calculatedParentNode.querySelectorAll(oAnnotator.possiblePrecedingSiblingNames);
		  var possiblePrecedingSiblingNodesNumber = possiblePrecedingSiblingNodes.length;
		  var lastPossiblePrecedingSiblingNodeIndex = possiblePrecedingSiblingNodesNumber - 1;
		  if (possiblePrecedingSiblingNodes[0].compareDocumentPosition(userSelectedFormerParentNode) & 2) {
		    //check if userSelectedFormerParentNode is before all possiblePrecedingSiblingNodes
		    calculatedPrecedingSiblingNode = possiblePrecedingSiblingNodes[0];
		  } else if (possiblePrecedingSiblingNodes[lastPossiblePrecedingSiblingNodeIndex].compareDocumentPosition(userSelectedFormerParentNode) & 4) {
		    //check if userSelectedFormerParentNode is after all possiblePrecedingSiblingNodes
		    calculatedPrecedingSiblingNode = possiblePrecedingSiblingNodes[lastPossiblePrecedingSiblingNodeIndex];
		  } else {
		    //calculate the exact preceding sibling node
		    calculatedPrecedingSiblingNode = possiblePrecedingSiblingNodes[calculatePrecedingSiblingNode(userSelectedFormerParentNode, possiblePrecedingSiblingNodesNumber, possiblePrecedingSiblingNodes)];
		  }		  
		}
		
		var nodeToInsert = oAnnotator.oAnnotatorMarkup.cloneNode(true);
		
		if (sessionParameters["track-changes"] == "true") {
		  var insertChangeTemplate = teian._changeTrackingParameters["insert-change-template"].cloneNode(true);
		  var author = sessionParameters.user;
		  insertChangeTemplate.setAttribute("timestamp", Date.now());
		  insertChangeTemplate.setAttribute("class", author + "_track_changes");
		  insertChangeTemplate.appendChild(nodeToInsert);
		  nodeToInsert = insertChangeTemplate;
		  teian._addChangeSummary(nodeToInsert, document.querySelector("div[author = '" + author + "']"));
		}
		
		if ("insert insert-parametrized".indexOf(sAnnotatorType) != -1) {
		  if (calculatedPrecedingSiblingNode == null || calculatedPrecedingSiblingNode.nextElementSibling == null) {
		    calculatedParentNode.appendChild(nodeToInsert);
		  } else {
		    calculatedParentNode.insertBefore(nodeToInsert, calculatedPrecedingSiblingNode.nextElementSibling);
		  } 
		} else {
			if (sOperationType == 'add') {
				oSelection.getRangeAt(0).surroundContents(nodeToInsert);
			} else {
				// this gets HTML content for complex entities
				// only have to append this content to replacing node
				// oSelection.getRangeAt(0)
				$(oSelection.anchorNode).replaceWith($(nodeToInsert).text(oSelection.anchorNode.textContent));
				utils.sOperationType = 'add';
			}
			oSelection.removeAllRanges();
		}
	} ],
	"ui" : {},
	"store" : function() {
		var utils = teian.utils;
		utils.oSavedSelection = null;
		var content = $('#teian-content *')[0].cloneNode(true);
		content.setAttribute("content-url", teian.contentUrl);
		var contentAsString = $x.serializeToString(content);
		if (teian.sessionParameters["track-changes"] == "true") {
		  contentAsString = teian._convertTrackChangesHtmlToPi(contentAsString);		  
		}
		//filter out HTML br elements
		contentAsString = contentAsString.replace(/<br xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\" \/>/g, "");
		$x.instance('data').load($x.parseFromString(contentAsString));
		$x.submission({
			"ref" : "simpath:instance('data')/*",
			"resource" : utils.baseURI + "services/store.xq",
			"mode" : "synchronous",
			"method" : "post",
			"simpath-submit-done" : function(xhReq) {
				//alert('Data was saved to file: \n' + xhReq.responseText);
			}
		});
		// return false;
	},
	"annotate" : function() {
		var sContent = $("#teian-content pre").text();
		$("#teian-content pre").remove();
		$("#teian-content").append($x.parseFromString(sContent).childNodes[0].cloneNode(true));
	},
	"source" : function() {
		var sContent = $x.serializeToString($x.transform($x._fDocFromNode($("#teian-content > *")[0]), $x._XSLTtemplates[4]));
		$("#teian-content *").remove();
		$("<pre/>").appendTo($("#teian-content")).text(sContent);
	},
	"lock" : function() {
		$('#teian-content')[0].contentEditable = false;
	},
	"unlock" : function() {
		$('#teian-content')[0].contentEditable = true;
	},
	"editEntity" : function() {
		var utils = teian.utils, oEntityToClear = utils.oEntityToClear, sEntityToClearName = oEntityToClear.nodeName;
		if (utils.sEditableAnnotatorIDs.indexOf(' ' + sEntityToClearName + ' ') == -1) {
			var errorMsg = teian._errors[3];
			alert(errorMsg.replace(/%entityName/, sEntityToClearName));
			return;
		}
		utils.sOperationType = 'edit';
		var oRange = rangy.createRange(), sHTMLAnnotatorID = $x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@name = '" + sEntityToClearName
				+ "']/@id")[0].value;
		oRange.selectNodeContents(oEntityToClear);
		var oSelection = rangy.getSelection();
		oSelection.removeAllRanges();
		oSelection.addRange(oRange);
		$('#' + sHTMLAnnotatorID).click();
	},
	"toggleViewChanges" : function() {
	  //toggle view changes based upon teian.sessionParameters["show-changes"]
	  var sessionParameters = teian.sessionParameters;
	  if (sessionParameters["show-changes"] == "true") {
	    teian._hideChanges();
	    sessionParameters["show-changes"] = "false";
	  } else {
	    teian._showChanges();
	    sessionParameters["show-changes"] = "true";	    
	  }
	},
	"_showChanges" : function() {
	    document.getElementById("teian-content").style.width = '700px';
	    document.getElementById("changes-container").style.display = 'inline';
	    document.styleSheets[0].deleteRule(0);
	    document.styleSheets[0].insertRule("ins, del {display: inline;}", 0);	    
	    
	},
	"_hideChanges" : function() {document.getElementById("teian-content").style.width = '98%';
	    document.getElementById("changes-container").style.display = 'none';
	    document.styleSheets[0].deleteRule(0);
	    document.styleSheets[0].insertRule("del {display: none;}", 0);	    
	},
	"_errors" : [],
	"_fGetData" : function(sURI) {
		$x.submission({
			"ref" : "simpath:instance('data')",
			"resource" : sURI,
			"mode" : "synchronous",
			"method" : "get"
		});
		
		var contentRootElement = $x._instances['data'].documentElement;
		var contentRootElementClarkName = '{' + contentRootElement.namespaceURI + '}' + contentRootElement.nodeName;
		// load the CSS stlying file
		var fileref = document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", $x
				.xpath("simpath:instance('config')//teian:file[teian:content-root-element-name = '" + contentRootElementClarkName + "']/@css-href")[0].value);
		document.getElementsByTagName("head")[0].appendChild(fileref);
		// load the specific annotators
		$x.submission({
		  "ref" : "simpath:instance('vocabulary-annotators')",
		  "resource" : $x.xpath("simpath:instance('config')//teian:file[teian:content-root-element-name = '" + contentRootElementClarkName + "']/@annotators-href")[0].value,
		  "mode" : "synchronous",
		  "method" : "get"
		});
		// load kyer-toolbar-menu
		$x.submission({
					"ref" : "simpath:instance('menus')",
					"resource" : $x.xpath("simpath:instance('config')//teian:file[teian:content-root-element-name = '" + contentRootElementClarkName + "']/@menus-href")[0].value,
					"mode" : "synchronous",
					"method" : "get"
		});
		// load vocabulary specific lang file
		$x.submission({
			"ref" : "simpath:instance('vocabulary-ui-lang')",
			"resource" : $x.xpath("simpath:instance('config')//teian:file[teian:content-root-element-name = '" + contentRootElementClarkName + "']/@lang-href")[0].value,
			"mode" : "synchronous",
			"method" : "get"
		});
		
		_errors = teian._errors;
		_errors.push($x.xpath("simpath:instance('vocabulary-ui-lang')//teian:selection-empty/text()"));
		_errors.push($x.xpath("simpath:instance('vocabulary-ui-lang')//teian:forbidden-overlapping/text()"));
		_errors.push($x.xpath("simpath:instance('vocabulary-ui-lang')//teian:selection-non-empty/text()"));
		_errors.push($x.xpath("simpath:instance('vocabulary-ui-lang')//teian:non-editable-entity/text()"));
		
		//process processing instructions for tracking changes
		if (teian.sessionParameters["track-changes"] == "true") {
		  //use the vocabulary specific PIs for tracking changes
		  var changeTrackingParameters = teian._changeTrackingParameters;
		  if ($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = 'insert-start-tracker']") != "") {
		     changeTrackingParameters.insertStart = $x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = 'insert-start-tracker']/teian:content-model")[0].childNodes[0].target;
		  }
		  if ($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = 'insert-end-tracker']") != "") {
		    changeTrackingParameters.insertEnd = $x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = 'insert-end-tracker']/teian:content-model")[0].childNodes[0].target;
		  }
		  if ($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = 'delete-start-tracker']") != "") {
		    changeTrackingParameters.deleteStart = $x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = 'delete-start-tracker']/teian:content-model")[0].childNodes[0].target;
		  }
		  if ($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = 'delete-end-tracker']") != "") {
		    changeTrackingParameters.deleteEnd = $x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = 'delete-end-tracker']/teian:content-model")[0].childNodes[0].target;
		  }		  
		  var contentAsString = $x.instance('data').source();
		  contentAsString = contentAsString.replace(new RegExp("\\?" + changeTrackingParameters.insertEnd + "\\?", "g"), "/ins")
		    .replace(new RegExp("\\?" + changeTrackingParameters.deleteEnd + "\\?", "g"), "/del")
		    .replace(new RegExp("(\\?" + changeTrackingParameters.insertStart + ")([^>]*)(\\?>)", "g"), "ins xmlns=\"http://www.w3.org/1999/xhtml\"$2>")
		    .replace(new RegExp("(\\?" + changeTrackingParameters.deleteStart + ")([^>]*)(\\?)", "g"), "del xmlns=\"http://www.w3.org/1999/xhtml\"$2")		    
		  ;
		  document.getElementById("teian-content").appendChild($x.parseFromString(contentAsString).documentElement);
		  return;
		}		

		($x.utils.isIE) ? $("#teian-content").html($x.instance('data').source()) : $("#teian-content").append($($x._instances["data"].documentElement.cloneNode(true)));
	}
};

teian.acceptAllChanges = function() {
  teian._acceptOrRejectAllChanges("accept");
};

teian.acceptChange = function(changeId, changeType) {
  var change = document.getElementById(changeId);  
  switch (changeType) {
    case "Added":
      var changeChildren = change.childNodes;
      var fragment = document.createDocumentFragment();
      for (var i = 0, il = changeChildren.length; i < il; i++) {
	fragment.appendChild(changeChildren[i].cloneNode(true));	
      }
      change.parentNode.replaceChild(fragment.cloneNode(true), change);      
    break;
    case "Deleted":
      change.parentNode.removeChild(change);
    break;
  }
  var changeSummary = document.getElementById("summary-" + changeId);
  changeSummary.parentNode.removeChild(changeSummary);  
};

teian.goToChange = function(goToAction) {
  var currentChangesSummaryIndex = teian._changeTrackingParameters["changes-summary-index"];
  var changeHtmlElements = document.querySelectorAll("ins, del");
  var lastChangesSummaryIndex = changeHtmlElements.length - 1;
  teian._removeClass(changeHtmlElements[currentChangesSummaryIndex], "change-selection");
  var goToChangesSummaryIndex;
  switch (goToAction) {
    case "first":
      goToChangesSummaryIndex = 0;
    break;
    case "previous":
      goToChangesSummaryIndex = (currentChangesSummaryIndex == 0) ? lastChangesSummaryIndex : currentChangesSummaryIndex - 1;
    break;    
    case "next":
      goToChangesSummaryIndex = (currentChangesSummaryIndex == lastChangesSummaryIndex) ? 0 : currentChangesSummaryIndex + 1;
    break;    
    case "last":
      goToChangesSummaryIndex = lastChangesSummaryIndex;
    break;    
  }
  teian._addClass(changeHtmlElements[goToChangesSummaryIndex], "change-selection");
  teian._changeTrackingParameters["changes-summary-index"] = goToChangesSummaryIndex;
};

teian.rejectAllChanges = function() {
  teian._acceptOrRejectAllChanges("reject");
};

teian.rejectChange = function(changeId, changeType) {
  var change = document.getElementById(changeId);
  switch (changeType) {
    case "Added":
      change.parentNode.removeChild(change);
    break;
    case "Deleted":
      var changeChildren = change.childNodes;
      var fragment = document.createDocumentFragment();
      for (var i = 0, il = changeChildren.length; i < il; i++) {
	fragment.appendChild(changeChildren[i].cloneNode(true));	
      }
      change.parentNode.replaceChild(fragment.cloneNode(true), change);
    break;
  }
  teian._deleteChangeSummary(changeId);
};

teian.sessionParameters = {
  "track-changes" : "true",
  "show-changes" : "true",
  "user" : "Reviewer1",
  "user-color" : "pink",
  "track-changes-authors" : {
    "author" : {
      "name" : "Reviewer1",
      "color" : "pink"
    }
  }
};

teian.toggleTrackChanges = function() {
  //toggle track changes based upon teian.sessionParameters["track-changes"] == "true"
  var currentButton = document.getElementById("toggle-track-changes-button");
  var currentButtonText = currentButton.textContent;
  var sessionParameters = teian.sessionParameters;
  if (sessionParameters["track-changes"] == "true") {
    currentButton.textContent = currentButtonText.substring(0, currentButtonText.indexOf(" ✔"));
    sessionParameters["track-changes"] = "false";
  } else {
    currentButton.textContent = currentButtonText + " ✔";
    sessionParameters["track-changes"] = "true";
  }
};

teian._acceptOrRejectAllChanges = function(action) {
  var contentNode = document.getElementById("teian-content").firstElementChild;
  var content = contentNode.cloneNode(true);
  contentNode.parentNode.replaceChild($x.transform($x._fDocFromNode(content), $x._instances[action + '-all-changes']).documentElement, contentNode);
  var changes = document.getElementById("changes-container").querySelectorAll(".teian-change-container");
  for (var i = 0, il = changes.length; i < il; i++) {
    var change = changes[i];
    change.parentNode.removeChild(change);
  }
};

teian._addChangeSummary = function(change, authorChangesContainer) {
  var changeContainer = document.createElement("div");
  changeContainer.setAttribute("class", "teian-change-container");
  var changeId = change.getAttribute("id");
  changeContainer.setAttribute("id", "summary-" + changeId);
  var changeType = ((change.nodeName == "INS") ? "Added" : "Deleted");
  changeContainer.textContent = changeType + ": " + change.textContent + " " + change.getAttribute("timestamp");
  var image = document.createElement("input");
  image.setAttribute("type", "image");
  image.setAttribute("src", "../resources/images/passed.png");
  image.setAttribute("title", "Accept change");
  image.setAttribute("onclick", "teian.acceptChange('" + changeId + "', '" + changeType + "');");
  changeContainer.appendChild(image.cloneNode(true));
  image.setAttribute("src", "../resources/images/failed.png");
  image.setAttribute("title", "Reject change");
  image.setAttribute("onclick", "teian.rejectChange('" + changeId + "', '" + changeType + "');");
  changeContainer.appendChild(image.cloneNode(true));
  authorChangesContainer.appendChild(changeContainer); 
};

teian._addClass = function(element, newClass) {
  var currentClass = element.getAttribute("class");
  element.setAttribute("class", currentClass + " " + newClass)
};

teian._changeTrackingParameters = {
  "insertStart" : "teian-insert-start",
  "insertEnd" : "teian-insert-end",
  "deleteStart" : "teian-delete-start",
  "deleteEnd" : "teian-delete-end",
  "changes-summary-index" : -1
};

teian._convertTrackChangesHtmlToPi = function(contentAsString) {
  var changeTrackingParameters = teian._changeTrackingParameters;
  contentAsString = contentAsString.replace(/\/ins/g, "?" + changeTrackingParameters.insertEnd + "?")
    .replace(/\/del/g, "?" + changeTrackingParameters.deleteEnd + "?")
    .replace(new RegExp("(ins xmlns=\"http://www.w3.org/1999/xhtml\")([^>]*)", "g"), "?" + changeTrackingParameters.insertStart + "$2?")
    .replace(new RegExp("(del xmlns=\"http://www.w3.org/1999/xhtml\")([^>]*)", "g"), "?" + changeTrackingParameters.deleteStart + "$2?")
  ;
  return contentAsString;
};

teian._deleteChangeSummary = function(changeId) {
  var changeSummary = document.getElementById("summary-" + changeId);
  changeSummary.parentNode.removeChild(changeSummary);
};

teian._generateChangesSummary = function(sessionParameters, sModuleBaseURI) {
  //summarize changes for rendering them
  var changesAuthors = {};
  var changeHtmlElements = document.querySelectorAll("ins, del");
  for (var i = 0, il = changeHtmlElements.length; i < il; i++) {
    var changeHtmlElement = changeHtmlElements[i];
    var author = changeHtmlElement.getAttribute("author");
    changeHtmlElement.setAttribute("id", "teian-change-" + i);
    changeHtmlElement.setAttribute("class", author + "_track_changes");
    changesAuthors[author] = 1;
  }
  
  var changesContainer = document.getElementById("changes-container");
  //output the changes
  for (var author in changesAuthors) {
    var authorChangesContainer = document.createElement("div");
    authorChangesContainer.setAttribute("author", author);
    var changeAuthorContainer = document.createElement("span");
    changeAuthorContainer.textContent = author;
    changeAuthorContainer.setAttribute("style", "background-color: " + sessionParameters["user-color"] + ";");
    authorChangesContainer.appendChild(changeAuthorContainer);
    var changes = document.querySelectorAll("ins[author = '" + author + "'], del[author = '" + author + "']");
    for (var i = 0, il = changes.length; i < il; i++) {
      var change = changes[i];
      teian._addChangeSummary(change, authorChangesContainer);
    }
    changesContainer.appendChild(authorChangesContainer);
  }
  
  //initialize change selection
  teian._addClass(changeHtmlElements[0], "change-selection");
  teian._changeTrackingParameters["changes-summary-index"] = 0;
  
  //initialize the HTML templates for rendering changes
  var insertChangeTemplate = document.createElement("ins");
  insertChangeTemplate.setAttribute("author", sessionParameters.user);
  teian._changeTrackingParameters["insert-change-template"] = insertChangeTemplate;
  
  //load XSLT stylesheets for processing changes markup
  $x.submission({
    "ref" : "simpath:instance('accept-all-changes')",
    "resource" : sModuleBaseURI + "core/track-changes/accept-all-changes.xml",
    "mode" : "synchronous",
    "method" : "get"
  });
  $x.submission({
    "ref" : "simpath:instance('reject-all-changes')",
    "resource" : sModuleBaseURI + "core/track-changes/reject-all-changes.xml",
    "mode" : "synchronous",
    "method" : "get"
  });  
};

teian._removeClass = function(element, classToRemove) {
  var currentClass = element.getAttribute("class");
  element.setAttribute("class", currentClass.replace(classToRemove, ""))
};

$(document).ready(
  function() {
    var sessionParameters = teian.sessionParameters;
    // get the tei-ann module's base uri
    var sDocumentURL = document.URL, sModuleBaseURI = sDocumentURL.substring(0, sDocumentURL.indexOf("core/teian.html")), utils = teian.utils, _errors = teian._errors;
    utils.baseURI = sModuleBaseURI;
					// load the standard annotators
					$x.submission({
						"ref" : "simpath:instance('standard-annotators')",
						"resource" : sModuleBaseURI + "core/standard-annotators.xml",
						"mode" : "synchronous",
						"method" : "get"
					});
					// load standard lang file and initialize the error messages
					$x.submission({
						"ref" : "simpath:instance('standard-ui-lang')",
						"resource" : sModuleBaseURI + "config/lang/en.xml",
						"mode" : "synchronous",
						"method" : "get"
					});

					// load the teian configuration file
					$x.submission({
						"ref" : "simpath:instance('config')",
						"resource" : sModuleBaseURI + "config/config.xml",
						"mode" : "synchronous",
						"method" : "get"
					});

					// get the data file
					var q = document.location.search || document.location.hash;
					if (q) {
						teian.contentUrl = q.substring(9);
						teian._fGetData(teian.contentUrl);						
			
						//toggle changes based upon sessionParameters["show-changes"]
						if (sessionParameters["show-changes"] == "true") {
						  teian._showChanges();
						} else {
						  teian._hideChanges();	    
						}						
						
						//initialize tracking of changes
						if (sessionParameters["track-changes"] == "true") {
						  teian._generateChangesSummary(sessionParameters, sModuleBaseURI);
						}
						
						// get the tei-ann module's base uri
						var sStandardAnnotatorIDs = "";
						var sAnnotatorIDs = "";
						var sEditableAnnotatorIDs = "";
						var oDataRoot = $("#teian-content > *")[0];
						var sDataRootPrefix = oDataRoot.prefix ? oDataRoot.prefix + ":" : "";
						var oDataRootNodeName = oDataRoot.nodeName;
						// generate the annotators' IDs string
						$($x.xpath("simpath:instance('standard-annotators')//teian:annotator/@id")).each(function(index) {
						  sAnnotatorIDs += this.value + ' ';
						});
						sStandardAnnotatorIDs = sAnnotatorIDs;
						$($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator/@id")).each(function(index) {
							sAnnotatorIDs += $(this).val() + ' ';
						});

						// generate the editable annotators' IDs string
						$($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@editable = 'true']/@name")).each(function(index) {
							sEditableAnnotatorIDs += $(this).val() + ' ';
						});
						utils.sEditableAnnotatorIDs = sEditableAnnotatorIDs;

						function generateAnnotators() {
							// themes roller
							// load main theme
							$.themes.setDefaults({
								"defaultTheme" : "cupertino" // The ID of the
							// default
							// theme, first one if
							// blank
							});
							$.themes.init({
								themeBase : 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/'
							// , onSelect: reloadIE
							});
							// generate the annotators
							var oToolbarMenuItems = $("div[appearance='kyer-toolbar-menu']").find("button[id]");
							var oContextMenuItems = $("ul[appearance='kyer-context-menu']").find("a[id]");
							var oMenuItems = oToolbarMenuItems.add(oContextMenuItems);

							oMenuItems
									.each(function(index) {
										var oHTMLAnnotator = $(this), oHTMLAnnotator0 = this, sAnnotatorId = oHTMLAnnotator.attr('id'), sHTMLAnnotatorType = oHTMLAnnotator
												.attr('appearance');

										if (sAnnotatorIDs.indexOf(sAnnotatorId) != -1 && sAnnotatorId != '') {
											// generate the standard annotation markup
											if (sStandardAnnotatorIDs.indexOf(sAnnotatorId) != -1) {
												var oAnnotator0 = $x.xpath("simpath:instance('standard-annotators')//teian:annotator[@id = '" + sAnnotatorId + "']")[0];
												var oAnnotator = $(oAnnotator0);
												var oLang0 = $x.xpath("simpath:instance('standard-ui-lang')//teian:annotator[@id = '" + sAnnotatorId + "']")[0];
												var oLang = $(oLang0);
												// set the annotator title
												oHTMLAnnotator.attr('title', $x.xpath("/teian:annotator/teian:toolbar-button-title/text()", oLang0));
												// set the annotator label
												oHTMLAnnotator.html((sHTMLAnnotatorType == 'image-button' ? "<img src=\"" + sModuleBaseURI + "config/images/"
														+ $x.xpath("/teian:annotator/teian:annotator-icon-name/text()", oAnnotator0) + "\"/>" : "")
														+ $x.serializeToString($x.xpath("/teian:annotator/teian:toolbar-button-label", oLang0)[0]));
												$($x.xpath("simpath:instance('standard-annotators')//teian:annotator[@id = '" + sAnnotatorId
																+ "']/teian:annotator/teian:annotator-panel")[0]).appendTo("body");
											}
											// generate the vocabulary specific annotation markup
											else {
												var oAnnotator0 = $x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = '" + sAnnotatorId + "']")[0], oAnnotator = $(oAnnotator0), oLang0 = $x
														.xpath("simpath:instance('vocabulary-ui-lang')//teian:annotator[@id = '" + sAnnotatorId + "']")[0], oLang = $(oLang0), sAnnotatorType = oAnnotator
														.attr('type-code');
												// set the annotator title
												oHTMLAnnotator.attr('title', $x.xpath("/teian:annotator/teian:toolbar-button-title/text()", oLang0));
												// set the annotator label
												oHTMLAnnotator.html((sHTMLAnnotatorType == 'image-button' ? "<img src=\"" + sModuleBaseURI + "config/images/"
														+ $x.xpath("/teian:annotator/teian:annotator-icon-name/text()", oAnnotator0) + "\"/>" : "")
														+ $x.serializeToString($x.xpath("/teian:annotator/teian:toolbar-button-label", oLang0)[0]));
												$($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = '" + sAnnotatorId
														+ "']/teian:annotator/teian:annotator-panel")[0]).appendTo("body");												
												//set the possible parents names
												var possibleParentNames = $x.xpath(
														"normalize-space(/teian:annotator/teian:annotator-possible-parent-element-names/text())", oAnnotator0);
												oHTMLAnnotator0.sPossibleParents = (possibleParentNames != "") ? ", " + possibleParentNames + "," : ", " + oDataRootNodeName + ",";
												
												//set the possible preceding siblings names
												var possiblePrecedingSiblingNames = $x.xpath(
														"normalize-space(/teian:annotator/teian:annotator-possible-preceding-sibling-element-names/text())", oAnnotator0);
												oHTMLAnnotator0.possiblePrecedingSiblingNames = possiblePrecedingSiblingNames.replace(/@/g, "");
												

												var oAnnotatorMarkup = $(typeof (document.createElementNS) == 'undefined' ? document.createElement(sDataRootPrefix
														+ oAnnotator.attr('name')) : document.createElementNS(oDataRoot.namespaceURI, sDataRootPrefix
														+ oAnnotator.attr('name')));

												// append the annotator attributes
												if ($x.xpath("count(/teian:annotator/teian:annotator-attribute)", oAnnotator0) != 0) {
													$($x.xpath("/teian:annotator/teian:annotator-attribute", oAnnotator0)).each(function(index) {
														var oAnnotatorAttr = $(this);
														oAnnotatorMarkup.attr(oAnnotatorAttr.attr('name'), oAnnotatorAttr.attr('value'));
													});
												}
												oHTMLAnnotator0.oAnnotatorMarkup = oAnnotatorMarkup[0];

												switch (sAnnotatorType) {
												case 'selected-wrap':
													// set the command for
													// annotator
													oHTMLAnnotator.click(function() {
														teian.annotator[0](this, 'selected-wrap');
													});		
													break;
												case 'selected-wrap-parameterized':
													// set the command for
													// annotator
													oHTMLAnnotator.click(function() {
														if (rangy.getSelection() == "") {
															alert(teian._errors[0]);
															return;
														}
														teian.utils.saveSelection();
														teian.ui[sAnnotatorId].dialog('open');
													});
													// load the data model containing the annotator's UI
													//alert($x.serializeToString(oAnnotator0));	
													$($x.xpath("/teian:annotator/teian:annotator-panel", oAnnotator0)[0]).appendTo("body");
													break;
												case 'insert':
													oHTMLAnnotator.click(function(eventObject) {
														if (rangy.getSelection() != "") {
															alert(teian._errors[2]);
															return;
														}
														teian.utils.saveSelection();
														teian.annotator[0](this, 'insert', eventObject);
													});
													oHTMLAnnotator0.oAnnotatorMarkup = $x.xpath("/teian:annotator/teian:content-model/*", oAnnotator0)[0].cloneNode(true);
													break;
												case 'insert-parametrized':
													oHTMLAnnotator.click(function(eventObject) {
														if (rangy.getSelection() != "") {
															alert(teian._errors[2]);
															return;
														}
														teian.utils.saveSelection();
														teian.ui[sAnnotatorId].dialog('open');
													});
													$($x.xpath("/teian:annotator/teian:annotator-panel", oAnnotator0)[0]).appendTo("body");
													oHTMLAnnotator0.oAnnotatorMarkup = $x.xpath("/teian:annotator/teian:content-model/*", oAnnotator0)[0].cloneNode(true);
													break;													
												case 'selected-wrap-server':
													oHTMLAnnotator.click(function() {
														if (rangy.getSelection() == "") {
															alert(teian._errors[0]);
															return;
														}
														teian.utils.saveSelection();
														// registering the active annotator's id - to be removed in v. 2.1
														teian.ui.activeAnnotatorId = sAnnotatorId;
														teian.ui['selected-wrap-server-annotator'].dialog('option', 'title', $x
																.xpath("simpath:instance('standard-ui-lang')//teian:annotator[@id = '" + sAnnotatorId
																		+ "']/teian:annotator-panel/teian:annotator-panel-title/text()"));
														teian.ui['selected-wrap-server-annotator'].dialog('open');
													});
													// registering the annotator's main attribute, which will hold the search result - to be removed in v. 2.1
													oHTMLAnnotator0.sMainAttrName = $($x.xpath("/teian:annotator/teian:annotator-attribute/@name", oAnnotator0)[0]).val();
													// register the service URI
													oHTMLAnnotator0.sServiceURI = $x.xpath("/teian:annotator/teian:annotator-id-service-uri/text()", oAnnotator0);
													// count these annotators
													teian.ui['selected-wrap-server-annotators-counter'] = sAnnotatorId;
													break;
												}
											}
										}
									});

							// load the data model containing the 'selected-wrap-server'vocabulary-annotators' UI
							// this have to be done separately as the UI is
							// common to
							// all annotators
							if (teian.ui['selected-wrap-server-annotators-counter']) {
								$($x.xpath("simpath:instance('vocabulary-annotators')/teian:annotators/teian:common-panels/teian:common-panel[@id = 'selected-wrap-server-annotator-panel']")[0])
										.appendTo("body");
							}
						}
						// initialize rangy
						utils.oSavedSelection = null;
						utils.oEntityToClear = null;
						rangy.init();
						utils.saveSelection = function() {
							// Remove markers for previously saved selection
							if (teian.utils.oSavedSelection) {
								rangy.removeMarkers(teian.utils.oSavedSelection);
							}
							teian.utils.oSavedSelection = rangy.saveSelection();
						}
						utils.restoreSelection = function() {
							if (teian.utils.oSavedSelection) {
								rangy.restoreSelection(teian.utils.oSavedSelection, true);
								teian.utils.oSavedSelection = null;
							}
						}
						// define the search results' instance
						$x.instance('search-results').load($x.parseFromString("<db/>"));

						$('#teian-content').mousedown(function(event) {
							switch (event.which) {
							case 3:
								teian.utils.oEntityToClear = event.target;
							break;
							}
						});
						document.addEventListener("kyer-model-construct-done", generateAnnotators, false);
					}
				      //generate the context menu
				      $.contextMenu({
					selector: '#teian-content', 
					items: $.contextMenu.fromMenu($('#teian-context-menu'))
				      });
				      //register listener for click event on #teian-content, in order to get click coordinates
				      $('#teian-content').bind("click", function(eventObject) {
					utils.clickY = eventObject.pageY - document.getElementById("teian-content").offsetTop;
				      });
				      utils.contenContainerHalfHeight = document.getElementById("teian-content").offsetHeight / 2;
				});
$(window).load(function() {
	$("#kFloadingMask").fadeOut();
	$("#unlock-button").trigger("click");
});

// $('#themeSelection').themes();
// var first = true;
//
// // IE doesn't update the display immediately, so reload the
// // page
// function reloadIE(id, display, url) {
// if (!first && $.browser.msie) {
// window.location.href = window.location.href;
// }
// first = false;
// }
