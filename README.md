# Description
Teian is a standalone, web-based annotator and limited editor for any XML vocabulary. It works by directly annotating the respective XML file or fragment. The end user does not have to know the XML markup, but just choose the text to annotate, and select an annotator.

Teian can be easily extended in order to use new XML vocabularies.
 
Teian was originally developed for the U.S. Department of State, Office of the Historian, and released as open source for the benefit of community. Its development was further funded by the University of Richmond, USA.

The documentation is [here](documentation/index.html).

The unit tests are [here](tests/index.html).

# Changelog
Version 2.4.6 - 2019-04-10
1. Activated gh-pages, in order to proper serve the unit tests' pages.

Version 2.4.5 - 2016-05-17
1. Fixed the paths for rangy files.
2. Minor changes related to the extension functions.

Version 2.4.4 - 2016-05-02
1. Added teian:functions parameter for the session configuration file.
2. Added mechanism for defining custom JS function in session configuration.

Version 2.4.3 - 2016-04-28
1. Improved the function to extract the query parameters.

Version 2.4.2 - 2016-04-26
1. Updated the URLs of the dependencies.

Version 2.4.1 - 2015-07-04
1. Added unit test for Sanskrit transliteration in TEI.

Version 2.4.0 - 2015-03-12
1. Added unit test for TEI 'linkGrp' element.
2. Added support for building xar.
3. Set width of 'menu.kyer-vertical-menu' to 0px when there are no annotators.
4. Styled the 'linkGrp' and 'link' TEI elements. 

Version 2.3.9 - 2014-11-08
Version 2.3.8 - 2014-03-14
Version 2.3.7 - 2013-03-25
Various bug fixes.

Version 2.3.6 - 2013.02.28
Feature #364: Add session configuration file, containing content url and config file url
Feature #365: Simplify the config file
Feature #366: Add unit test for DITA vocabulary

Version 2.3.5 - 2013.02.23
Feature #30: Replace the toolbar menu with HTML5 menu element
Feature #295: Add unit tests for DocBook and XLIFF vocabularies
Feature #363: Add content model for TEI annotators

Version 2.3.4 - 2012.08.06
1. Created resource folder for each vocabulary.
2. Created models for the standard and for the specific annotators. The current version for standard annotators is 0.1, and the current version for specific annotators is 0.4.
3. Added XSLT stylesheet to convert from specific annotators v0.3 to v0.4.
4. Version 0.4 of specific annotators contains 'teian:content-model' child for annotators of type 'insert', allowing to define the content model to be inserted in document.
5. Insertion of annotators of types 'insert' and 'insert-parametrized' is now more user assistive, namely the respective element will be inserted at a calculated position, based upon user's click and according to schema for that element. Thus, teian is "guessing" user's intentions. If no possible parent is provided, teian wil automatically use the document root as possible parent.

Version 2.3.3 - 2012.07.01
1. Added support for selecting the UI language for standard annotators.
2. Added support for selecting the UI language for vocabulary specific annotators.

Version 2.3.2 - 2012.06.26
1. Added support for selecting the annotator definitions based upon the content's root element, just like for the selecting the CSS file used for styling the content.
2. Added support for selecting the menus referring the annotators based upon the content type.

Version 2.3.1 - 2012.06.10
1. Refined support for content automatic styling.

Version 2.3 - 2012.06.07
1. Teian is now able to style the content by using a CSS file adapted to the respective content. This is based upon the correspondence provided in $TEIAN_HOME/config/config.xml file, in the section about the CSS files for styling the content. Thus, in case when the content's root element has the Clark name '{http://docbook.org/ns/docbook}book', or '{http://docbook.org/ns/docbook}bookmap', the content is styled by using the CSS file located at the relative location provided by @css-file-href's value. One can add any names for the root element are needed.  

Version 2.2 - 2011.11.02
This version allows editing and clearing entities' properties, and also editing of text content of the entities.

Version 2.1 - 2011-09-28
Added support for annotators presented as context menu items.

Version 2.2 - 2011-09-23
Major refactoring of teian. The architecture was changed, so that now teian allows editing directly big XML files.
The styling is provided by specialized CSS files for each XML vocabulary one chooses.

Version 1.4.7 - 2011.11.05
1. The plugin works now with Opera, Safari, and Google Chrome.
2. Some minor code improvements.

Version 1.4.7 - 2010.10.13
1. Improved documentation.

Version 1.4.6 - 2010.08.05
1. Added "Edit Entity" command, used to edit entities.
2. Added "Clear entity" and "Edit Entity" commands as options for editor's context menu, which is available by right-click inside text. Thus, there is no need for add "teiannRemoveEntityBtn" in toolbar item of exfk:rteOptions
element, within the respective page.
3. "Date" and "Hyperlink"annotators (and all of their type) are now editable.
