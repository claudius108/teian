<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.tei-c.org/ns/1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" version="2.0">
    <xsl:template match="/">
        <div>
            <xsl:apply-templates select="//rng:element"/>
        </div>
    </xsl:template>
    <xsl:template match="rng:element">
        <xsl:variable name="list-of-parents">
            <xsl:for-each select="//rng:ref[@name=current()/@name]">
                <xsl:value-of select="ancestor::rng:element[1]/@name"/>
                <xsl:text> </xsl:text>
            </xsl:for-each>
        </xsl:variable>
        <list>
            <head>parents of <gi>
                    <xsl:value-of select="@name"/>
                </gi>
            </head>
            <xsl:for-each select="distinct-values( tokenize( $list-of-parents, ' ') )">
                <xsl:sort/>
                <item>
                    <xsl:value-of select="."/>
                </item>
            </xsl:for-each>
        </list>
    </xsl:template>
</xsl:stylesheet>