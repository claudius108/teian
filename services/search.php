<?php

header('Content-type: application/xml');

$data = new DOMDocument();
$data->load('data/'. $_GET['element-name'] . '.xml');

$searchString = strtolower($_GET['search-string']);
$data_xpath = new DOMXpath($data);
$data_xpath->registerNamespace("php", "http://php.net/xpath");
$data_xpath->registerPHPFunctions();

$items = $data_xpath->query("//item[contains(php:functionString('strtolower', label), '" . $searchString . "')]");

$result = new DOMDocument();
$result->loadXML('<items xmlns="http://www.w3.org/1999/xhtml" />');

$result_root = $result->documentElement;

foreach($items as $item) {
	$option_element = $result->createElementNS('http://www.w3.org/1999/xhtml', 'option', $item->getElementsByTagName("label")->item(0)->nodeValue);
	$option_element->setAttribute("value", $item->getElementsByTagName("value")->item(0)->nodeValue);
	$option_element->setAttribute("title", $item->getElementsByTagName("description")->item(0)->nodeValue);
	$result_root->appendChild($option_element);
}

echo $result->saveXML();

?>
