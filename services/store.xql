xquery version "1.0";

let $post-data := request:get-data()
, $data-collection-url := replace(substring-before(request:get-effective-uri(), 'store.xql'), "^/(exist/)?(rest/)?", "/")


return xmldb:store(concat($data-collection-url, 'data'), 'index.xml', $post-data)