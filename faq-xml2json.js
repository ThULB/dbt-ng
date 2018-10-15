const fs = require("fs");
const DomParser = require("dom-parser");
const parser = new DomParser();

fs.readFile(__dirname + "/src/assets/content/faq.xml", "utf8", function(err, xml){
  if (!err){
    const dom = parser.parseFromString(xml);
    
    const result = [];
    
    const faq = dom.getElementsByTagName("faq")[0];
    faq.getElementsByTagName("category").forEach((c) => {
    	const cte = c.getElementsByTagName("categoryTitle")[0];

    	const cat = {
    		title: cte.textContent.trim(),
    		href: cte.getAttribute("href"),
    		entry: []
    	};
    	
    	c.getElementsByTagName("entry").forEach((e) => {
    		const entry = {
    			href: e.getAttribute("href"),
    			question: e.getElementsByTagName("question")[0].textContent.trim(),
    			answer: e.getElementsByTagName("answer")[0].innerHTML.trim()
    		};
    		
    		cat.entry.push(entry);
    	});
    	
    	result.push(cat);
    });
    
    fs.writeFile(__dirname + "/src/assets/content/faq.json", JSON.stringify(result), (err) => {
    	if (err) throw err;
    	console.log("The file was succesfully saved!");
    });
  }
})