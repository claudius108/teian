<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format" version="1.0">
    <xsl:param name="use.id.as.filename" select="'1'"/>
    <xsl:param name="admon.graphics" select="'1'"/>
    <xsl:param name="admon.graphics.path"/>
    <xsl:param name="chunk.section.depth" select="0"/>
    <xsl:param name="html.stylesheet" select="'docbook.css'"/>
    <xsl:template name="user.footer.content">
        <P class="copyright">© 2011 Claudius Teodorescu</P>
    </xsl:template>
</xsl:stylesheet>