<?xml version="1.0" encoding="UTF-8"?>
<!--
                                                                                
 ***** BEGIN LICENSE BLOCK *****                                                
   - Version: MPL 1.1/GPL 2.0/LGPL 2.1                                          
   -                                                                            
   - The contents of this file are subject to the Mozilla Public License Version
   - 1.1 (the "License"); you may not use this file except in compliance with   
   - the License. You may obtain a copy of the License at                       
   - http://www.mozilla.org/MPL/                                                
   -                                                                            
   - Software distributed under the License is distributed on an "AS IS" basis, 
   - WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License   
   - for the specific language governing rights and limitations under the       
   - License.                                                                   
   -                                                                            
   - The Original Code is mozilla.org code.                                     
   -                                                                            
   - The Initial Developer of the Original Code is                              
   - Netscape Communications Corporation.                                       
   - Portions created by the Initial Developer are Copyright (C) 2002           
   - the Initial Developer. All Rights Reserved.                                
   -                                                                            
   - Contributor(s):                                                            
   -   Jonas Sicking <sicking@bigfoot.com> (Original author)                    
   -                                                                            
   - Alternatively, the contents of this file may be used under the terms of    
   - either the GNU General Public License Version 2 or later (the "GPL"), or   
   - the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),   
   - in which case the provisions of the GPL or the LGPL are applicable instead 
   - of those above. If you wish to allow use of your version of this file only 
   - under the terms of either the GPL or the LGPL, and not to allow others to  
   - use your version of this file under the terms of the MPL, indicate your    
   - decision by deleting the provisions above and replace them with the notice 
   - and other provisions required by the LGPL or the GPL. If you do not delete 
   - the provisions above, a recipient may use your version of this file under  
   - the terms of any one of the MPL, the GPL or the LGPL.                      
   -                                                                            
   - ***** END LICENSE BLOCK *****                                              
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:param name="selectedNodes" select="@comment()"/>
    <xsl:param name="scalarExpr" select="@comment()"/>

<!-- The following is not used because of a bug in Mozilla :( -->
<!--
  <xsl:key name="kattPref" match="@*" 
   use="concat(generate-id(..), '|', substring-before(., ':'))"/>
-->
    <xsl:output method="html"/>
    <xsl:template match="/">
        <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <style>
          body {
            font-family: 'Verdana', sans-serif;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          
          html {
            width: 100%;
            margin: 0;
            padding: 0;
          }
          
          #header {
            background-color: #ccc;
            border-bottom: 3px solid black;
            padding: 0.5em;
            margin-bottom: 1em;
          }
          
          img {
            float: left;
            margin: 0.5em;
          }
          
          table {
            border-spacing: 0;
            margin: 0;
          }
          
          td {
            padding: 0;
          }
          
          .markup {
            color: blue
          }
          
          .elemname {
            color: #990000;
          }
          
          .attrname {
            color: #990000;
            font-weight: bold;
          }
          
          .namespace {
            color: red;
            font-weight: bold;
          }
          .attrvalue {
            color: black;
            font-weight: bold;
          }
          
          .text {
            color: black;
            font-weight: bold;
          }
          
          .indent {
            margin-left: 1em;
          }
          
          .comment {
            color: #888888;
            font-style: italic;
          }
          
          .pi {
            color: blue;
          }
          
          .expander &gt; div {
            width: 1em;
          }
          
          .expander {
            cursor: default;
            -moz-user-select: none;
            vertical-align: top;
            text-align: center;
          }
          
          .expander-closed .expander-content {
            display: none;
          }
          
          .se  {background-Color:yellow}
        </style>
                <script>
                    <xsl:comment><![CDATA[

function clicked(event) {
  try {
	var thisNode = event.target;
    var par = event.target.parentNode;
    if (thisNode.nodeName == 'TD' && thisNode.className == 'expander') {
      if (par.parentNode.className == 'expander-closed') {
        par.parentNode.className = '';
        event.target.data = '-';
      }
      else {
        par.parentNode.className = 'expander-closed';
        event.target.data = '+';
      }
    }
  } catch (e) {
  }
}

]]></xsl:comment>
                </script>
            </head>
            <body bgcolor="#E9FEFE" ID="theBody" title="{$scalarExpr}" onclick="clicked(event) ">
                <xsl:apply-templates/>
            </body>
        </html>
    </xsl:template>
    <xsl:template match="*">
        <xsl:variable name="belongs" select="count($selectedNodes|.)-count($selectedNodes)"/>
        <div class="indent">
            <span class="markup">&lt;</span>
            <xsl:variable name="class">
                <xsl:choose>
                    <xsl:when test="$belongs = 0">se</xsl:when>
                    <xsl:otherwise>elemname</xsl:otherwise>
                </xsl:choose>
            </xsl:variable>
            <span class="{$class}">
                <xsl:value-of select="name(.)"/>
            </span>
            <xsl:call-template name="findNamespace"/>
            <xsl:apply-templates select="@*"/>
            <span class="markup">/&gt;</span>
        </div>
    </xsl:template>
    <xsl:template match="*[text()]">
        <xsl:variable name="belongs" select="count($selectedNodes|.)-count($selectedNodes)"/>
        <xsl:variable name="class">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>elemname</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <div class="indent">
            <span class="markup">&lt;</span>
            <span class="{$class}">
                <xsl:value-of select="name(.)"/>
            </span>
            <xsl:call-template name="findNamespace"/>
            <xsl:apply-templates select="@*"/>
            <span class="markup">&gt;</span>      
      <!--<span class="text">        
        <xsl:value-of select="."/>      -->
            <xsl:apply-templates/>
      <!--</span>-->
            <span class="markup">&lt;/</span>
            <span class="elemname">
                <xsl:value-of select="name(.)"/>
            </span>
            <span class="markup">&gt;</span>
        </div>
    </xsl:template>
    <xsl:template match="*[* or processing-instruction() or comment()                           or string-length(text()) &gt; 50]" priority="10">
        <xsl:variable name="belongs" select="count($selectedNodes|.)-count($selectedNodes)"/>
        <xsl:variable name="class">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>elemname</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <table>
            <tr>
                <td class="expander">
          -
          <div/>
                </td>
                <td>
                    <span class="markup">&lt;</span>
                    <span class="{$class}">
                        <xsl:value-of select="name(.)"/>
                    </span>
                    <xsl:call-template name="findNamespace"/>
                    <xsl:apply-templates select="@*"/>
                    <span class="markup">&gt;</span>
                    <div class="expander-content">
                        <xsl:apply-templates/>
                    </div>
                    <span class="markup">&lt;/</span>
                    <span class="elemname">
                        <xsl:value-of select="name(.)"/>
                    </span>
                    <span class="markup">&gt;</span>
                </td>
            </tr>
        </table>
    </xsl:template>
    <xsl:template match="@*">
        <xsl:variable name="belongs" select="count($selectedNodes|.)-count($selectedNodes)"/>
        <xsl:variable name="vPos" select="position()"/>
        <xsl:variable name="vPref" select="substring-before(name(), ':')"/>
        <xsl:if test="$vPref                 and                    not(../@*[position() &lt; $vPos]                            [substring-before(name(), ':')                             = $vPref]                       )">
            <xsl:call-template name="findNamespace"/>
        </xsl:if>

<!-- The following is not used because of a bug in Mozilla :( -->

<!--
    <xsl:if test=
    "generate-id() 
    = 
     generate-id(key('kattPref', 
                      concat(generate-id(..), '|', substring-before(., ':'))
                     )[1]
                )">
      <xsl:call-template name="findNamespace"/>
    </xsl:if>
-->
        <xsl:variable name="class">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>attrname</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="class2">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>markup</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="class3">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>attrvalue</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:text> </xsl:text>
        <span class="{$class}">
            <xsl:value-of select="name(.)"/>
        </span>
        <span class="{$class2}">="</span>
        <span class="{$class3}">      
      <!-- <xsl:value-of select="."/> -->
            <xsl:call-template name="replaceAmpersands">
                <xsl:with-param name="vString" select="string(.)"/>
            </xsl:call-template>
        </span>
        <span class="{$class2}">"</span>
    </xsl:template>
    <xsl:template match="text()">
        <xsl:variable name="belongs" select="count($selectedNodes|.)-count($selectedNodes)"/>
        <xsl:variable name="class">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>text</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <span class="{$class}">        
      <!-- <xsl:value-of select="."/>       -->
            <xsl:call-template name="replaceAmpersands">
                <xsl:with-param name="vString" select="string(.)"/>
            </xsl:call-template>
        </span>
    </xsl:template>
    <xsl:template match="processing-instruction()">
        <xsl:variable name="belongs" select="count($selectedNodes|.)-count($selectedNodes)"/>
        <xsl:variable name="class">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>indent pi</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <div class="{$class}">

      &lt;?
      <xsl:value-of select="name(.)"/>
            <xsl:text> </xsl:text>
            <xsl:value-of select="."/>
?&gt;
    
    </div>
    </xsl:template>
    <xsl:template match="processing-instruction()[string-length(.) &gt; 50]">
        <xsl:variable name="belongs" select="count($selectedNodes|.)-count($selectedNodes)"/>
        <xsl:variable name="class">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>pi</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="class2">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>indent expander-content</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <table>
            <tr>
                <td class="expander">
          -          
          <div/>
                </td>
                <td class="{$class}">

          &lt;?
          <xsl:value-of select="name(.)"/>
                    <div class="{$class2}">
                        <xsl:value-of select="."/>
                    </div>
                    <xsl:text>?&gt;</xsl:text>
                </td>
            </tr>
        </table>
    </xsl:template>
    <xsl:template match="comment()">
        <xsl:variable name="belongs" select="count($selectedNodes|.)-count($selectedNodes)"/>
        <xsl:variable name="class">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>comment indent</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <div class="{$class}">      
      &lt;!--
      <xsl:value-of select="."/>
      --&gt;    
    </div>
    </xsl:template>
    <xsl:template match="comment()[string-length(.) &gt; 50]">
        <xsl:variable name="belongs" select="count($selectedNodes|.)-count($selectedNodes)"/>
        <xsl:variable name="class">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>comment</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="class2">
            <xsl:choose>
                <xsl:when test="$belongs = 0">se</xsl:when>
                <xsl:otherwise>indent expander-content</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <table>
            <tr>
                <td class="expander">
          -          
          <div/>
                </td>
                <td class="{$class}">          
          &lt;!--            
          <div class="{$class2}">
                        <xsl:value-of select="."/>
                    </div>          
          --&gt;        
        </td>
            </tr>
        </table>
    </xsl:template>
    <xsl:template name="findNamespace">
        <xsl:variable name="vName" select="substring-before(name(), ':')"/>
        <xsl:variable name="vUri" select="namespace-uri(.)"/>
        <xsl:variable name="vAncestNamespace">
            <xsl:call-template name="findAncNamespace">
                <xsl:with-param name="pName" select="$vName"/>
                <xsl:with-param name="pUri" select="$vUri"/>
            </xsl:call-template>
        </xsl:variable>
        <xsl:if test="not(number($vAncestNamespace))">
            <xsl:if test="namespace-uri()                   or                     not(generate-id()                         =                          generate-id(../@*[name()                                           =                                            name(current())]                                     )                         )">
                <xsl:if test="parent::* or namespace-uri() or contains(name(), ':')">
                    <xsl:text> </xsl:text>
                    <span class="namespace">
                        <xsl:value-of select="'xmlns'"/>
                        <xsl:if test="contains(name(), ':')">
                            <xsl:value-of select="concat(':', $vName)"/>
                        </xsl:if>
                    </span>
                    <span class="markup">="</span>
                    <span class="namespace">
                        <xsl:value-of select="namespace-uri()"/>
                    </span>
                    <span class="markup">"</span>
                </xsl:if>
            </xsl:if>
        </xsl:if>
    </xsl:template>
    <xsl:template name="findAncNamespace">
        <xsl:param name="pNode" select="."/>
        <xsl:param name="pName" select="substring-before(name(), ':')"/>
        <xsl:param name="pUri" select="namespace-uri(.)"/>
        <xsl:choose>
            <xsl:when test="not($pNode/parent::*)                       and not($pName) and not($pUri)">1</xsl:when>
            <xsl:when test="not($pNode/parent::*)">0</xsl:when>
            <xsl:otherwise>
                <xsl:variable name="vSamePrefs" select="number($pName                       = substring-before(name($pNode/..), ':')                       )"/>
                <xsl:variable name="vSameUris" select="number($pUri  = namespace-uri($pNode/..))"/>
                <xsl:choose>
                    <xsl:when test="$vSamePrefs and not($vSameUris)">0</xsl:when>
                    <xsl:when test="not($vSamePrefs)">
                        <xsl:call-template name="findAncNamespace">
                            <xsl:with-param name="pNode" select="$pNode/.."/>
                            <xsl:with-param name="pName" select="$pName"/>
                            <xsl:with-param name="pUri" select="$pUri"/>
                        </xsl:call-template>
                    </xsl:when>
                    <xsl:otherwise>1</xsl:otherwise>
                </xsl:choose>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    <xsl:template name="replaceAmpersands">
        <xsl:param name="vString"/>
        <xsl:variable name="vAmp">&amp;</xsl:variable>
        <xsl:choose>
            <xsl:when test="contains($vString, $vAmp)">
                <xsl:value-of select="substring-before($vString, $vAmp)"/>
                <xsl:value-of select="concat($vAmp, 'amp;')"/>
                <xsl:call-template name="replaceAmpersands">
                    <xsl:with-param name="vString" select="substring-after($vString, $vAmp)"/>
                </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$vString"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>