/*
 * Teian - Web adnotator
 * By Claudius Teodorescu
 * Licensed under LGPL.
 */

window.teian = {};

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

teian.annotate = function() {
  var sContent = $("#teian-content pre").text();
  $("#teian-content pre").remove();
  $("#teian-content").append($x.parseFromString(sContent).childNodes[0].cloneNode(true));
};

teian.annotator = [
  function(oAnnotator, sAnnotatorType, eventObject) {
	  var utils = teian.utils;
 
    teian.utils.restoreSelection();
    var oSelection = rangy.getSelection();
    if (oSelection == "" && "insert insert-parametrized".indexOf(sAnnotatorType) == -1) {
      alert(teian._errors[0]);
      return;
    }

    var sOperationType = utils.sOperationType;
    var sessionParameters = teian.sessionParameters;		
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
      if (oAnnotator.sPossibleParents.indexOf(", " + currentParentNode.nodeName + ",") != -1) {
		userSelectedFormerParentNode = currentParentNode;
		return calculateParentNode(currentParentNode.parentNode, currentParentNode);
      } else {
    	  calculatedParentNode = currentParentNode;
      }      
    }
   
    function calculatePrecedingSiblingNode(userSelectedFormerParentNode, possiblePrecedingSiblingNodesNumber, possiblePrecedingSiblingNodes) {
      var startNodeIndex = 0;
      var middleNodeIndex;
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
    if (userSelectedFormerParentNode != null && oAnnotator.possiblePrecedingSiblingNames != '') {
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
      var insertChangeTemplate = document.querySelector("#insert-change-template > *").cloneNode(true);
      insertChangeTemplate.appendChild(nodeToInsert);
      nodeToInsert = insertChangeTemplate;
    }
    
    if ("insert insert-parametrized".indexOf(sAnnotatorType) != -1) {
      if (calculatedPrecedingSiblingNode == null || calculatedPrecedingSiblingNode.nextElementSibling == null) {
    	  if (calculatedParentNode.nodeName == userSelectedParentNode.nodeName) {
        	  var range = oSelection.rangeCount ? oSelection.getRangeAt(0) : null;    		  
    		  if (range) {
        		  range.insertNode(nodeToInsert);
        		  rangy.getSelection().setSingleRange(range);
        	  }
    	  } else {
    		  calculatedParentNode.appendChild(nodeToInsert);    		  
    	  }
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
    
    if (sessionParameters["track-changes"] == "true") {
      teian._addChangeSummaryForExistingChange(nodeToInsert, null, 'new');
    }    
  }
];

teian.compatibility = {};

teian.compatibility['annotator-types'] = "0.4";	

teian.editEntity = function() {
  var utils = teian.utils;
  var oEntityToClear = utils.oEntityToClear;
  var sEntityToClearName = oEntityToClear.nodeName;
  if (utils.sEditableAnnotatorIDs.indexOf(' ' + sEntityToClearName + ' ') == -1) {
    var errorMsg = teian._errors[3];
    alert(errorMsg.replace(/%entityName/, sEntityToClearName));
    return;
  }
  utils.sOperationType = 'edit';
  var oRange = rangy.createRange(), sHTMLAnnotatorID = $x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@name = '" + sEntityToClearName + "']/@id")[0].value;
  oRange.selectNodeContents(oEntityToClear);
  var oSelection = rangy.getSelection();
  oSelection.removeAllRanges();
  oSelection.addRange(oRange);
  $('#' + sHTMLAnnotatorID).click();
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
  
  changeHtmlElements[goToChangesSummaryIndex].className += ' change-selection';
  teian._changeTrackingParameters["changes-summary-index"] = goToChangesSummaryIndex;
};

teian.lock = function() {
  document.getElementById("teian-content").contentEditable = false;
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
  "track-changes"	: "false",
  "show-changes" 	: "false",
  "lock-content" 	: "false",
  "user" 			: "reviewer1",
  "user-color" 		: "pink"
};

teian.source = function() {
  var sContent = $x.serializeToString($x.transform($x._fDocFromNode(document.querySelector("#teian-content > *")), $x._XSLTtemplates[4]));
  $("#teian-content *").remove();
  $("<pre/>").appendTo($("#teian-content")).text(sContent);
};

teian.save = function() {
  var utils = teian.utils;
  utils.oSavedSelection = null;
  var content = document.querySelector('#teian-content > *').cloneNode(true);
  content.setAttribute("content-url", teian.contentUrl);
  var contentAsString = $x.serializeToString(content);
  alert(contentAsString);
  if (teian.sessionParameters['track-changes'] == "true") {
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
};

teian.toggleViewChanges = function() {
  //toggle view changes based upon teian.sessionParameters["show-changes"]
  var sessionParameters = teian.sessionParameters;
  if (sessionParameters["show-changes"] == "true") {
    teian._hideChanges();
    sessionParameters["show-changes"] = "false";
  } else {
    teian._showChanges();
    sessionParameters["show-changes"] = "true";
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

teian.ui = {};

teian.utils = {};

teian.utils.sOperationType = "add";

teian.unlock = function() {
  document.getElementById("teian-content").contentEditable = true;
};

teian.version = "2.3.7";

teian._acceptOrRejectAllChanges = function(action) {
  var contentNode = document.getElementById("teian-content").firstElementChild;
  var content = contentNode.cloneNode(true);
  contentNode.parentNode.replaceChild($x.transform($x._fDocFromNode(content), $x._instances[action + '-all-changes']).documentElement, contentNode);
  var changes = document.getElementById("changes-container").querySelectorAll(".change-container");
  for (var i = 0, il = changes.length; i < il; i++) {
    var change = changes[i];
    change.parentNode.removeChild(change);
  }
};

teian._addChangeSummaryForExistingChange = function(change, authorChangesContainer, changeType) {
	//changeType is 'new'
	var timestamp = new Date();
	var time = timestamp.toISOString();
	
    if (changeType == 'existing') {
    	time = change.getAttribute('timestamp');
    }
    teian._addChangeSummary(change, authorChangesContainer, time);
}
teian._addChangeSummary = function(change, authorChangesContainer, timestamp) {
  var sessionParameters = teian.sessionParameters;
  var changeId = "teian-change-" + Date.now();
  var author = sessionParameters.user;
  author = change.getAttribute('author');
  change.setAttribute("id", changeId);
  change.setAttribute("timestamp", timestamp);
  change.setAttribute("class", author + "-track-changes");
  
  var changeSummary = document.querySelector("#change-summary-template > *").cloneNode(true);  
  var changeType = ((change.nodeName == "INS") ? "Added" : "Deleted");  
  changeSummary.setAttribute("id", "summary-" + changeId);
  changeSummary.querySelector("div:first-child").textContent = changeType + ": " + change.textContent + " " + change.getAttribute("timestamp");
  changeSummary.querySelectorAll("input[type = 'image']")[0].setAttribute("onclick", "teian.acceptChange('" + changeId + "', '" + changeType + "');");
  changeSummary.querySelectorAll("input[type = 'image']")[1].setAttribute("onclick", "teian.rejectChange('" + changeId + "', '" + changeType + "');");  
  
  if (authorChangesContainer != null) {
    authorChangesContainer.appendChild(changeSummary);   
  } else {
    document.querySelector("div[author = '" + author + "']").appendChild(changeSummary);    
  }  
};

teian._changeTrackingParameters = {
  "insertStartPiTarget" : "teian-insert-start",
  "insertEndPiTarget" : "teian-insert-end",
  "deleteStartPiTarget" : "teian-delete-start",
  "deleteEndPiTarget" : "teian-delete-end",
  "changes-summary-index" : -1
};

teian._convertTrackChangesHtmlToPi = function(contentAsString) {
  var changeTrackingParameters = teian._changeTrackingParameters;
  contentAsString = contentAsString.replace(/\/ins/g, "?" + changeTrackingParameters.insertEndPiTarget + "?")
    .replace(/\/del/g, "?" + changeTrackingParameters.deleteEndPiTarget + "?")
    .replace(new RegExp("(ins xmlns=\"http://www.w3.org/1999/xhtml\")([^>]*)", "g"), "?" + changeTrackingParameters.insertStartPiTarget + "$2?")
    .replace(new RegExp("(del xmlns=\"http://www.w3.org/1999/xhtml\")([^>]*)", "g"), "?" + changeTrackingParameters.deleteStartPiTarget + "$2?")
  ;
  return contentAsString;
};

teian._deleteChangeSummary = function(changeId) {
  var changeSummary = document.getElementById("summary-" + changeId);
  changeSummary.parentNode.removeChild(changeSummary);
};

teian._errors = [];

teian._generateChangesSummary = function(sessionParameters, sModuleBaseURI) {
  var currentAuthor = sessionParameters.user;
  var _changeTrackingParameters = teian._changeTrackingParameters;
  
  //summarize changes for rendering them
  var changesAuthors = {};
  changesAuthors[currentAuthor] = 1;
  var changeHtmlElements = document.getElementById("teian-content").querySelectorAll("ins, del");
  var changeHtmlElementsNumber = changeHtmlElements.length;
  for (var i = 0, il = changeHtmlElementsNumber; i < il; i++) {
    var changeHtmlElement = changeHtmlElements[i];
    var author = changeHtmlElement.getAttribute("author");
    changeHtmlElement.setAttribute("id", "teian-change-" + i);
    changeHtmlElement.setAttribute("class", author + "-track-changes");
    changesAuthors[author] = 1;
  }
  
  var changesContainer = document.getElementById("changes-container");
  //output the changes
  for (var author in changesAuthors) {
    var authorChangesContainer = document.createElement("div");
    authorChangesContainer.setAttribute("author", author);
    var changeAuthorContainer = document.createElement("span");
    changeAuthorContainer.textContent = author;
    changeAuthorContainer.setAttribute("style", "background-color: " + $x.xpath("simpath:instance('session-parameters')//teian:author[@name = '" + author + "']/@color")[0].value + ";");
    authorChangesContainer.appendChild(changeAuthorContainer);
    var changes = document.querySelectorAll("ins[author = '" + author + "'], del[author = '" + author + "']");
    for (var i = 0, il = changes.length; i < il; i++) {
      var change = changes[i];
      teian._addChangeSummaryForExistingChange(change, authorChangesContainer, 'existing');
    }
    changesContainer.appendChild(authorChangesContainer);
  }
  
  //initialize the HTML templates for rendering changes
  document.querySelector("#insert-change-template > *").setAttribute("author", currentAuthor);
  document.querySelector("#delete-change-template > *").setAttribute("author", currentAuthor);

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
  $x.submission({
	"ref" : "simpath:instance('generate-changes-summary')",
	"resource" : sModuleBaseURI + "core/track-changes/generate-changes-summary.xml",
	"mode" : "synchronous",
	"method" : "get"
  });  
  
  if (changeHtmlElementsNumber == 0) {
   return; 
  }
  
  //initialize change selection
  changeHtmlElements[0].className += ' change-selection';
  _changeTrackingParameters["changes-summary-index"] = 0;
};

teian._getContent = function(sURI) {
  $x.submission({
    "ref" : "simpath:instance('data')",
    "resource" : sURI,
    "mode" : "synchronous",
    "method" : "get"
  });
  
  var contentRootElement = $x.xpath("simpath:instance('data')/*")[0];
  var contentRootElementName = teian.utils.contentRootElementName = contentRootElement.nodeName;
  var contentRootElementClarkName = '{' + contentRootElement.namespaceURI + '}' + contentRootElementName;
  
  var vocabularyFolder = $x.xpath("simpath:instance('config')//teian:vocabulary[teian:content-root-element-name = '" + contentRootElementClarkName + "']/@href")[0].value;
  
  // load the CSS file specific for the vocabulary
  var fileref = document.createElement("link");
  fileref.setAttribute("rel", "stylesheet");
  fileref.setAttribute("type", "text/css");
  fileref.setAttribute("href", vocabularyFolder + "css/style.css");
  document.getElementsByTagName("head")[0].appendChild(fileref);
    
  // load the specific annotators
  $x.submission({
    "ref" : "simpath:instance('vocabulary-annotators')",
    "resource" : vocabularyFolder + "annotators/annotators.xml",
    "mode" : "synchronous",
    "method" : "get"
  });
  
  // load menus
  $x.submission({
	    "ref" : "simpath:instance('toolbar-menus')",
	    "resource" : "menus/toolbar-menus.xml",
	    "mode" : "synchronous",
	    "method" : "get"
  });
  $x.submission({
	    "ref" : "simpath:instance('context-menus')",
	    "resource" : "menus/context-menus.xml",
	    "mode" : "synchronous",
	    "method" : "get"
  });
  $x.submission({
	    "ref" : "simpath:instance('vertical-menus')",
	    "resource" : vocabularyFolder + "menus/vertical-menus.xml",
	    "mode" : "synchronous",
	    "method" : "get"
  });
  
  // load vocabulary specific lang file
  $x.submission({
    "ref" : "simpath:instance('vocabulary-ui-lang')",
    "resource" : vocabularyFolder + "lang/en-us.xml",
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
    var insertStartPiTarget = $x.xpath("simpath:instance('session-parameters')//teian:insert-start-pi-target")[0].textContent;
    var insertEndPiTarget = $x.xpath("simpath:instance('session-parameters')//teian:insert-end-pi-target")[0].textContent;
    var deleteStartPiTarget = $x.xpath("simpath:instance('session-parameters')//teian:delete-start-pi-target")[0].textContent;
    var deleteEndPiTarget = $x.xpath("simpath:instance('session-parameters')//teian:delete-end-pi-target")[0].textContent;    
    if (insertStartPiTarget != "") {
      changeTrackingParameters.insertStartPiTarget = insertStartPiTarget;
    }
    if (insertEndPiTarget != "") {
        changeTrackingParameters.insertEndPiTarget = insertEndPiTarget;
    }
    if (deleteStartPiTarget != "") {
        changeTrackingParameters.deleteStartPiTarget = deleteStartPiTarget;
    }
    if (deleteEndPiTarget != "") {
        changeTrackingParameters.deleteEndPiTarget = deleteEndPiTarget;
    }

    var contentAsString = $x.instance('data').source();
    contentAsString = contentAsString.replace(new RegExp("\\?" + changeTrackingParameters.insertEndPiTarget + "\\?", "g"), "/ins")
      .replace(new RegExp("\\?" + changeTrackingParameters.deleteEndPiTarget + "\\?", "g"), "/del")
      .replace(new RegExp("(\\?" + changeTrackingParameters.insertStartPiTarget + ")([^>]*)(\\?>)", "g"), "ins xmlns=\"http://www.w3.org/1999/xhtml\"$2>")
      .replace(new RegExp("(\\?" + changeTrackingParameters.deleteStartPiTarget + ")([^>]*)(\\?)", "g"), "del xmlns=\"http://www.w3.org/1999/xhtml\"$2")
    ;
    document.getElementById("teian-content").appendChild($x.parseFromString(contentAsString).documentElement);
    return;
  }
  
  ($x.utils.isIE) ? $("#teian-content").html($x.instance('data').source()) : $("#teian-content").append($($x._instances["data"].documentElement.cloneNode(true)));
};

teian._hideChanges = function() {
  document.getElementById("teian-content").style.width = '78%';
  document.getElementById("changes-container").style.display = 'none';
  document.styleSheets[0].deleteRule(0);
  document.styleSheets[0].insertRule("del {display: none;}", 0);
};

teian._removeClass = function(element, classToRemove) {
  var currentClass = element.getAttribute("class");
  element.setAttribute("class", currentClass.replace(classToRemove, ""))
};

teian._showChanges = function() {
  document.getElementById("teian-content").style.width = '67%';
  document.getElementById("changes-container").style.display = 'inline';
  document.styleSheets[0].deleteRule(0);
  document.styleSheets[0].insertRule("ins, del {display: inline;}", 0);
  var changeAuthors = $x.xpath("simpath:instance('session-parameters')//teian:author");
  for (var i = 0, il = changeAuthors.length; i < il; i++) {
	  var changeAuthor = changeAuthors[i];
	  document.styleSheets[0].insertRule('.' + changeAuthor.getAttribute('name') + '-track-changes {background-color: ' + changeAuthor.getAttribute('color') + ';}', 0);
  }
};

//Initialization of the module
//set the module's base URL
(function(sModuleName, sModuleNS) {
	var scriptUri = document.querySelector("script[src*='" + sModuleName + "']").src;
	window[sModuleNS ? sModuleNS : sModuleName].utils.baseURI = scriptUri.substring(0, scriptUri.indexOf("core/" + sModuleName + ".js"));
})('teian');


$(document).ready(
  function() {
    var sessionParameters = teian.sessionParameters;
    // get the teian module's base uri
    var sDocumentURL = document.URL;
    var utils = teian.utils;
    var sModuleBaseURI = utils.baseURI;    
    var _errors = teian._errors;
    
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
    
    // get the content file
    var q = document.location.search || document.location.hash;
    if (q) {
      var sessionUrl = q.substring(13);
      
      // load the session configuration file
      $x.submission({
        "ref" : "simpath:instance('session-parameters')",
        "resource" : sessionUrl,
        "mode" : "synchronous",
        "method" : "get"
      });
      
      teian.contentUrl = $x.xpath("simpath:instance('session-parameters')//teian:content-url")[0].textContent;
      
      // load the teian configuration file
      $x.submission({
        "ref" : "simpath:instance('config')",
        "resource" : $x.xpath("simpath:instance('session-parameters')//teian:config-url")[0].textContent,
        "mode" : "synchronous",
        "method" : "get"
      });
      
      // set the session parameters
      sessionParameters["track-changes"] = $x.xpath("simpath:instance('session-parameters')//teian:track-changes")[0].textContent;
      sessionParameters["show-changes"] = $x.xpath("simpath:instance('session-parameters')//teian:show-changes")[0].textContent;
      sessionParameters["lock-content"] = $x.xpath("simpath:instance('session-parameters')//teian:lock-content")[0].textContent;
      sessionParameters["user"] = $x.xpath("simpath:instance('session-parameters')//teian:user")[0].textContent;
      sessionParameters["user-color"] = $x.xpath("simpath:instance('session-parameters')//teian:user-color")[0].textContent;
      
      teian._getContent(teian.contentUrl);

//      jsPlumb.Defaults.Container = $("#teian-content");
//      var a = $("#a");
//      var b = $("#b");
//      
//      //Setting up drop options
//      var targetDropOptions = {
//              tolerance:'touch',
//              hoverClass:'dropHover',
//              activeClass:'dragActive'
//      };
//      
//      //Setting up a Target endPoint
//      var targetColor = "#316b31";
//      var targetEndpoint = {
//         endpoint:["Dot", { radius:4 }],
//         paintStyle:{ fillStyle:targetColor},
//         //isSource:true,
//         scope:"green dot",
//         connectorStyle:{ strokeStyle:targetColor, lineWidth:2 },
//         connector: ["Bezier", { curviness:63 } ],
//         maxConnections:3,
//         isTarget:true,
//         dropOptions : targetDropOptions
//      };
//      
//      //Setting up a Source endPoint
//      var sourceColor = "#ff9696";
//      var sourceEndpoint = {
//         endpoint:["Dot", { radius:4 }],
//         paintStyle:{ fillStyle:sourceColor},
//         isSource:true,
//         scope:"green dot",
//         connectorStyle:{ strokeStyle:sourceColor, lineWidth:2 },
//         connector: ["Bezier", { curviness:63 } ],
//         maxConnections:3,
//         //isTarget:true,
//         //dropOptions : targetDropOptions
//      };
//      
//      
//      //Set up endpoints on the divs
//      jsPlumb.addEndpoint($("#a") , { anchor:"BottomCenter" }, targetEndpoint);
//      jsPlumb.addEndpoint($("#b") , { anchor:"TopCenter" }, sourceEndpoint);
//      //jsPlumb.connect({ source:sourceEndpoint, target:targetEndpoint });
//      
//      jsPlumb.draggable($(".window"));      
      
      
      
      
      
      
      
      
      //toggle changes
      if (sessionParameters["show-changes"] == "true") {
    	  teian._showChanges();
      } else {
    	  teian._hideChanges();
      }
      
      //initialize tracking of changes
      if (sessionParameters["track-changes"] == "true") {
    	  teian._generateChangesSummary(sessionParameters, sModuleBaseURI);
    	  var generateChangesSummaryInstance = $x._instances['generate-changes-summary'].documentElement;
    	  generateChangesSummaryInstance.appendChild($x._instances['session-parameters'].documentElement.cloneNode(true));
    	  var changesContainer = document.getElementById('changes-container');
    	  generateChangesSummaryInstance.querySelector("*[name = 'test']").appendChild($x._instances['session-parameters'].documentElement.childNodes[1].cloneNode(true));
//    	  alert(generateChangesSummaryInstance.querySelector("*[name = 'test']").textContent);
    	  //alert($x.serializeToString($x.transform($x._fDocFromNode(document.querySelector("#teian-content > *")), $x.parseFromString(a).documentElement)));
    	  //changesContainer.parentNode.replaceChild($x.transform($x._fDocFromNode(document.querySelector("#teian-content > *")), $x.parseFromString(a).documentElement).documentElement, changesContainer);
    	  //alert($x._instances['generate-changes-summary'].documentElement.lastElementChild);
    	  changesContainer.parentNode.replaceChild($x.transform($x._fDocFromNode(document.querySelector("#teian-content > *")), $x._instances['generate-changes-summary'].documentElement).documentElement, changesContainer);
    	  //alert($x.serializeToString($x.transform($x._fDocFromNode(document.querySelector("#teian-content > *")), $x._instances['generate-changes-summary'].documentElement)));
      }
      
      //get the content's root element name
      var sStandardAnnotatorIDs = "";
      var sAnnotatorIDs = "";
      var sEditableAnnotatorIDs = "";
      var contentRootElementName = utils.contentRootElementName;

      // generate the annotators' IDs string
      var standardAnnotators = $x.xpath("simpath:instance('standard-annotators')//teian:annotator/@id");
      for (var i = 0, il = standardAnnotators.length; i < il; i++) {
    	  sAnnotatorIDs += standardAnnotators[i].value + ' ';
      }      
      sStandardAnnotatorIDs = sAnnotatorIDs;
      var vocabularyAnnotators = $x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator/@id");
      for (var i = 0, il = vocabularyAnnotators.length; i < il; i++) {
    	  sAnnotatorIDs += vocabularyAnnotators[i].value + ' ';
      }

      //generate the editable annotators' IDs string
      $($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@editable = 'true']/@name")).each(function(index) {
    	  sEditableAnnotatorIDs += $(this).val() + ' ';
      });
      utils.sEditableAnnotatorIDs = sEditableAnnotatorIDs;
      
      function generateAnnotators() {
		// themes roller
		// load main theme
//		$.themes.setDefaults({
//		  "defaultTheme" : "cupertino" // The ID of the default theme, first one if blank
//		});
          
//		$.themes.init({
//		  themeBase : 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/'
//		  // , onSelect: reloadIE
//		});
		
		//generate the annotators
		var oToolbarMenuItems = $(document.querySelectorAll("menu[data-kyerType = 'toolbar-menu'] a[id]"));
		var oVerticalMenuItems = $(document.querySelectorAll("menu[data-kyerType = 'vertical-menu'] a[id]"));
		//var oContextMenuItems = $(document.querySelectorAll("menu[data-kyerType = 'context-menu'] a[id]"));
		//var oTeianContextMenuItems = $(document.querySelectorAll("#teian-context-menu command[id]"));
		var oMenuItems = oToolbarMenuItems.add(oVerticalMenuItems);
		
		oMenuItems.each(function(index) {
		  var oHTMLAnnotator = $(this);
		  var oHTMLAnnotator0 = this;
		  var sAnnotatorId = oHTMLAnnotator.attr('id');
		  var sHTMLAnnotatorType = oHTMLAnnotator.attr('appearance');
		  
		  if (sAnnotatorIDs.indexOf(sAnnotatorId) != -1 && sAnnotatorId != '') {
		    //generate the standard annotation markup
		    if (sStandardAnnotatorIDs.indexOf(sAnnotatorId) != -1) {
		      var oAnnotator0 = $x.xpath("simpath:instance('standard-annotators')//teian:annotator[@id = '" + sAnnotatorId + "']")[0];
		      var oLang0 = $x.xpath("simpath:instance('standard-ui-lang')//teian:annotator[@id = '" + sAnnotatorId + "']")[0];
		      var oLang = $(oLang0);
		      
		      //set the annotator title
		      oHTMLAnnotator.attr('title', $x.xpath("/teian:annotator/teian:toolbar-button-title/text()", oLang0));
		      
		      //set the annotator label
		      oHTMLAnnotator.html((sHTMLAnnotatorType == 'image-button' ? "<img src=\"" + sModuleBaseURI + "config/images/"
			+ $x.xpath("/teian:annotator/teian:annotator-icon-name/text()", oAnnotator0) + "\"/>" : "")
			+ $x.serializeToString($x.xpath("/teian:annotator/teian:toolbar-button-label", oLang0)[0]));
		      
		      //load the annotator's UI
		      if ($x.xpath("/teian:annotator/teian:annotator-panel", oAnnotator0)) {
		    	  $($x.xpath("/teian:annotator/teian:annotator-panel", oAnnotator0)[0]).appendTo("body");
		      }
		    }
		    
		    //generate the vocabulary specific annotation markup
		    else {
		      var oAnnotator0 = $x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = '" + sAnnotatorId + "']")[0];
		      var oAnnotator = $(oAnnotator0);
		      var oLang0 = $x.xpath("simpath:instance('vocabulary-ui-lang')//teian:annotator[@id = '" + sAnnotatorId + "']")[0];
		      var oLang = $(oLang0);
		      var sAnnotatorType = oAnnotator.attr('type-code');
		      
		      //set the annotator title
		      oHTMLAnnotator.attr('title', $x.xpath("/teian:annotator/teian:toolbar-button-title/text()", oLang0));

		      //set the annotator label
		      var sAnnotatorIconUrl = $x.xpath("/teian:annotator/teian:annotator-icon-name/text()", oAnnotator0);
		      oHTMLAnnotator.html((sAnnotatorIconUrl != '' ? "<img src=\"" + sModuleBaseURI + "config/" + sAnnotatorIconUrl + "\"/>" : "")
		    		  + $x.serializeToString($x.xpath("/teian:annotator/teian:toolbar-button-label", oLang0)[0]));
		      $($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = '" + sAnnotatorId + "']/teian:annotator/teian:annotator-panel")[0]).appendTo("body");
			
		      //set the possible parents names
		      var possibleParentNames = $x.xpath("normalize-space(/teian:annotator/teian:annotator-possible-parent-element-names/text())", oAnnotator0);
		      oHTMLAnnotator0.sPossibleParents = (possibleParentNames != "") ? ", " + possibleParentNames + "," : ", " + contentRootElementName + ",";
		      
		      //set the possible preceding siblings names
		      var possiblePrecedingSiblingNames = $x.xpath("normalize-space(/teian:annotator/teian:annotator-possible-preceding-sibling-element-names/text())", oAnnotator0);
		      oHTMLAnnotator0.possiblePrecedingSiblingNames = possiblePrecedingSiblingNames.replace(/@/g, "");
		      
			  oHTMLAnnotator0.oAnnotatorMarkup = $x.xpath("/teian:annotator/teian:content-model/*", oAnnotator0)[0].cloneNode(true);
		      
		      switch (sAnnotatorType) {
				case 'selected-wrap':
				  //set the command for annotator
				  oHTMLAnnotator.click(function() {
				    teian.annotator[0](this, 'selected-wrap');
				  });
				break;
				case 'selected-wrap-parameterized':
				  //set the command for annotator
				  oHTMLAnnotator.click(function() {
				    if (rangy.getSelection() == "") {
				      alert(teian._errors[0]);
				      return;
				    }
				    teian.utils.saveSelection();
				    teian.ui[sAnnotatorId].dialog('open');
				  });
				  
				  //load the annotator's UI
//				  var annotatorUiElements = $x.xpath("/teian:annotator/teian:annotator-panel/*", oAnnotator0);
//				  for (var i = 0, il = annotatorUiElements.length; i < il; i++) {
//					  document.body.appendChild(annotatorUiElements[i].cloneNode(true));  
//				  }
				  $($x.xpath("/teian:annotator/teian:annotator-panel", oAnnotator0)[0].cloneNode(true)).appendTo("body");				  
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
				break;
				case 'selected-wrap-server':
				  oHTMLAnnotator.click(function() {
				    if (rangy.getSelection() == "") {
				      alert(teian._errors[0]);
				      return;
				    }
				    teian.utils.saveSelection();
				    
				    //registering the active annotator's id - to be removed in v. 2.1
				    teian.ui.activeAnnotatorId = sAnnotatorId;
				    teian.ui['selected-wrap-server-annotator'].dialog('option', 'title', 
				      $x.xpath("simpath:instance('standard-ui-lang')//teian:annotator[@id = '" + sAnnotatorId
				      + "']/teian:annotator-panel/teian:annotator-panel-title/text()"));
				    teian.ui['selected-wrap-server-annotator'].dialog('open');
				  });
				  
				  //registering the annotator's main attribute, which will hold the search result - to be removed in v. 2.1
				  //oHTMLAnnotator0.sMainAttrName = $($x.xpath("/teian:annotator/teian:annotator-attribute/@name", oAnnotator0)[0]).val();
				  
				  //register the service URI
				  oHTMLAnnotator0.sServiceURI = $x.xpath("/teian:annotator/teian:annotator-id-service-uri/text()", oAnnotator0);
				  
				  //count these annotators
				  teian.ui['selected-wrap-server-annotators-counter'] = sAnnotatorId;
				break;
		      }
		    }
		  }
		});
		
		//load the data model containing the 'selected-wrap-server'vocabulary-annotators' UI
		//this have to be done separately as the UI is common to all annotators
		if (teian.ui['selected-wrap-server-annotators-counter']) {
		  $($x.xpath("simpath:instance('vocabulary-annotators')/teian:annotators/teian:common-panels/teian:common-panel[@id = 'selected-wrap-server-annotator-panel']")[0])
		    .appendTo("body");
		}
      }
      
      //initialize rangy
      utils.oSavedSelection = null;
      utils.oEntityToClear = null;
      rangy.init();
      utils.saveSelection = function() {
		//remove markers for previously saved selection
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
      
      //define the search results' instance
      $x.instance('search-results').load($x.parseFromString("<db />"));
      $('#teian-content').mousedown(function(event) {
		switch (event.which) {
		  case 3:
		    teian.utils.oEntityToClear = event.target;
		  break;
		}
      });
      
      document.addEventListener("kyer-model-construct-done", generateAnnotators, false);
    }
    
    //register listener for click event on #teian-content, in order to get click coordinates
    $('#teian-content').bind("click", function(eventObject) {
      utils.clickY = eventObject.pageY - document.getElementById("teian-content").offsetTop;
    });
    utils.contenContainerHalfHeight = document.getElementById("teian-content").offsetHeight / 2;
  }
);

$(window).load(function() {
	$("#kFloadingMask").fadeOut();
	if (teian.sessionParameters["lock-content"] == "true") {
	  teian.lock(); 
	} else {
	  teian.unlock();
	}
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
