<?php

header('Content-type: application/xml');

$projects_metadata = new DOMDocument();
$projects_metadata->loadXML('<projects-metadata/>');

$projects_doc = getJson('http://sourceforge.net/api/user/username/claudius108/json');
$projects_xpath = new DOMXpath($projects_doc);
$projects = $projects_xpath->query("//*[role = 'Admin' and not(contains('kuberaForms u/claudius108', name)) ]");
$currentDate = date("Y-m-d");
$oneWeekBeforeDate = date('Y-m-d',(strtotime('-7 day', strtotime($currentDate))));
$oneMonthBeforeDate = date('Y-m-d',(strtotime('-30 day', strtotime($currentDate))));
$currentYear = date("Y");

$projects_metadata_root = $projects_metadata->documentElement;


foreach($projects as $project) {
	$unix_name = $project->getElementsByTagName("unix_name")->item(0)->nodeValue;
	$metadata_element = $projects_metadata_root->appendChild($projects_metadata->createElement("project-metadata"));
	$metadata = getXml('http://sourceforge.net/api/project/name/' . $unix_name . '/doap');
	$metadata_element->appendChild($projects_metadata->createElement('name', $project->getElementsByTagName("name")->item(0)->nodeValue));	
	$metadata_element->appendChild($projects_metadata->createElement('ranking', $metadata->getElementsByTagName("ranking")->item(0)->nodeValue));
	$date_created = $metadata->getElementsByTagName("created")->item(0)->nodeValue;
	
	$oneWeekToDate_downloads = $projects_metadata->importNode(getJson('https://sourceforge.net/projects/' . $unix_name . '/files/stats/json?start_date=' . $oneWeekBeforeDate . '&end_date=' . $currentDate)->documentElement->getElementsByTagName('downloads')->item(0), true);
	$oneWeekToDate_downloads->setAttribute("id", "one-week-to-date");
	$oneWeekToDate_downloads->setAttribute("start-date", $oneWeekBeforeDate);
	$oneWeekToDate_downloads->setAttribute("end-date", $currentDate);
	$metadata_element->appendChild($oneWeekToDate_downloads);
	
	$oneMonthToDate_downloads = $projects_metadata->importNode(getJson('https://sourceforge.net/projects/' . $unix_name . '/files/stats/json?start_date=' . $oneMonthBeforeDate . '&end_date=' . $currentDate)->documentElement->getElementsByTagName('downloads')->item(0), true);
	$oneMonthToDate_downloads->setAttribute("id", "one-month-to-date");
	$oneMonthToDate_downloads->setAttribute("start-date", $oneMonthBeforeDate);
	$oneMonthToDate_downloads->setAttribute("end-date", $currentDate);	
	$metadata_element->appendChild($oneMonthToDate_downloads);

	$yearToDate_downloads = $projects_metadata->importNode(getJson('https://sourceforge.net/projects/' . $unix_name . '/files/stats/json?start_date=' . $currentYear . '-01-01&end_date=' . $currentDate)->documentElement->getElementsByTagName('downloads')->item(0), true);
	$yearToDate_downloads->setAttribute("id", "year-to-date");
	$yearToDate_downloads->setAttribute("start-date", $currentYear . '-01-01');
	$yearToDate_downloads->setAttribute("end-date", $currentDate);	
	$metadata_element->appendChild($yearToDate_downloads);

	$dateCreatedToDate_downloads = $projects_metadata->importNode(getJson('https://sourceforge.net/projects/' . $unix_name . '/files/stats/json?start_date=' . $date_created . '&end_date=' . $currentDate)->documentElement->getElementsByTagName('downloads')->item(0), true);
	$dateCreatedToDate_downloads->setAttribute("id", "date-created-to-date");
	$dateCreatedToDate_downloads->setAttribute("start-date", $date_created);
	$dateCreatedToDate_downloads->setAttribute("end-date", $currentDate);	
	$metadata_element->appendChild($dateCreatedToDate_downloads);
}

$xsl = new DOMDocument;
$xsl->load('generate-downloads-container.xml');

$proc = new XSLTProcessor;
$proc->importStyleSheet($xsl);

$result = $proc->transformToXML($projects_metadata);

echo $result;

?>
