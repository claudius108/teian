<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://relaxng.org/ns/structure/1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" version="1.0">

  <!-- Reads in a TEI RELAX NG (XML syntax) file, and writes out the same with -->
  <!-- references to model classes resolved -->
  <!-- Conceived and started 2011-08-11, based entirely on
    http://wiki.tei-c.org/index.php/Relaxng_refAtt_resolver.xslt, 
    in response to Joe Wicentowski's post. -->
    <xsl:template match="/">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>
    <xsl:template match="rng:define[starts-with(@name,'model.') or starts-with(@name,'macro.')]">
        <xsl:comment>deleted define <xsl:value-of select="@name"/>
        </xsl:comment>
    </xsl:template>
    <xsl:template match="rng:define" mode="referred">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="rng:ref[starts-with(@name,'model.') or starts-with(@name,'macro.')]">
        <xsl:comment>resolved define <xsl:value-of select="@name"/>
        </xsl:comment>
        <xsl:variable name="name" select="@name"/>
        <xsl:apply-templates mode="referred" select="//rng:define[@name=$name]"/>
    </xsl:template>
</xsl:stylesheet>