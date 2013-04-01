<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	version="1.0">
	<xsl:template name="changeSummary">
		<xsl:param name="change" />
<!-- 		<xsl:variable name="change" select="$changeElement/*" /> -->
		<xsl:variable name="author" select="$change//@author" />
		<xsl:variable name="changeId" select="$change//@id" />
		<div id="summary-{$changeId}" test="{$author}">
			<div class="change-summary-author {concat($author, '-track-changes')}">
				<xsl:value-of select="$author" />
			</div>
			<div class="change-container">
				<div class="change-summary-title">
					<xsl:choose>
						<xsl:when test="local-name($change) = 'del'">
							<xsl:text>Deleted</xsl:text>
						</xsl:when>
						<xsl:otherwise>
							<xsl:text>Added</xsl:text>
						</xsl:otherwise>
					</xsl:choose>
					<xsl:text> on </xsl:text>
					<xsl:value-of select="$change//@timestamp" />
					<input style="float: right;" type="image" onclick="teian.acceptChange('{$changeId}', 'Deleted');" title="Accept change"
						src="../resources/images/passed.png" />
					<input style="float: right;" type="image" onclick="teian.rejectChange('{$changeId}', 'Deleted');" title="Reject change"
						src="../resources/images/failed.png" />
				</div>
				<div class="change-summary-content">
					<xsl:value-of select="$change" />
				</div>
			</div>
		</div>
	</xsl:template>
</xsl:stylesheet>
