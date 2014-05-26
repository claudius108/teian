xquery version "3.0";

let $post-data := request:get-data()
let $data-collection-url := replace(substring-before(request:get-effective-uri(), 'store.xq'), "^/(exist/)?(rest/)?", "/")


return xmldb:store(concat($data-collection-url, 'data'), 'index.xml', $post-data)