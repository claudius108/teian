xquery version "1.0";

let $post-data := request:get-parameter('data', '')
, $data-collection-url := replace(substring-before(request:get-effective-uri(), 'save.xq'), "^/(exist/)?(rest/)?", "/")


return
	(
		util:declare-option( "exist:serialize", "method=xhtml media-type=text/html indent=yes" ),
		transform:transform(util:parse($post-data), doc(concat($data-collection-url, 'mozDss5.xsl')), ())
	)