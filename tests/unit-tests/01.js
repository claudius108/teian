function fGetSelectedText(oNode) {
	window.getSelection().getRangeAt(0).surroundContents(oNode);
	window.getSelection().removeAllRanges();
}
function fHiElement(sRendAttrValue) {
	var oNode = document.createElement("hi");
	oNode.setAttribute("rend", sRendAttrValue);
	fGetSelectedText(oNode);
}
$(document).ready(function() {
	$.get("01.xml", function(xml) {
		$("body").append($("<div/>", {html : xml.documentElement.childNodes[1]}));
		var $oDateDialog = $("#date-dialog").dialog({
			autoOpen: false,
			width : 700,
			height : 200,
			buttons: {
				"Save": function() {
					$( this ).dialog( "close" );
					$("#date-input").val("");
				},
				Cancel: function() {
					$( this ).dialog( "close" );
					$("#date-input").val("");
				}
			}
		});
		$("#date-button").click(function(){
				$("#date-input").val(window.getSelection());
				$oDateDialog.dialog('open');
		});
	}, "xml").error(function() { alert("Cannot load file: " + this.url + "."); });
});