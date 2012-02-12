xquery version "1.0";

declare default element namespace "http://www.w3.org/1999/xhtml";

let $word := request:get-parameter('word', '')
, $data-collection-url := replace(concat(substring-before(request:get-effective-uri(), 'suggest.xql'), 'data/'), "^/(exist/)?(rest/)?", "/")
, $items-doc := doc(concat($data-collection-url, concat(request:get-parameter('type', ''), '.xml')))//*[local-name() = 'item']


return
	<items>
		{
		for $item in $items-doc[contains(upper-case(*[local-name() = 'label']/text()), upper-case($word))]
		return <option value="{$item/*[local-name() = 'value']}" title="{$item/*[local-name() = 'description']}">{$item/*[local-name() = 'label']/text()}</option>
		}
	</items>