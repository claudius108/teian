<?php

//header('Content-type: application/xml');

$data = new DOMDocument();
$data->load('data/'. $_GET['element-name'] . '.xml');

$searchString = strtolower($_GET['search-string']);
$data_xpath = new DOMXpath($data);
$data_xpath->registerNamespace("php", "http://php.net/xpath");
$data_xpath->registerPHPFunctions();

$items = $data_xpath->query("//item[contains(php:functionString('strtolower', label), '" . $searchString . "')]");

$result = new DOMDocument();
$result->loadXML('<items xmlns="http://www.w3.org/1999/xhtml" />');

foreach($items as $item) {
	$result->appendChild($result->importNode($item, true));
}

echo $result->saveXML();

?>
