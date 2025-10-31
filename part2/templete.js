const socialMedia = d3.csv("data.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const 
      width = 600,
      height = 400;

    const margin = {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    };

    // Create the SVG container
    const svg = d3.select('#boxplot')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', 'lightyellow');

    // Set up scales for x and y axes
    const yScale = d3.scaleLinear()
              .domain([0, 1000])
              .range([height - margin.bottom, margin.top]);

    const xScale = d3.scaleBand()
              .domain([...new Set(data.map(d => d.AgeGroup))])
              .range([margin.left, width - margin.right])
              .padding(0.3);

    // Add x-axis
    const xAxis = svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    // Add y-axis
    const yAxis = svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));
    
    // FIXED: Calculate ALL statistics needed
    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.Likes).sort(d3.ascending);
        const min = d3.min(values); 
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5); 
        const q3 = d3.quantile(values, 0.75);     
        const max = d3.max(values);             
        return {min, q1, median, q3, max};
    };

    // Use d3.rollup to group the data by AgeGroup and apply rollupFunction to each group
    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.AgeGroup);

    // Loop through each age group and get the metrics
    quantilesByGroups.forEach((quantiles, AgeGroup) => {
        // Get the x position and convert the categorical feature to a position
        const x = xScale(AgeGroup);
        // Width allocated for each boxplot
        const boxWidth = xScale.bandwidth();

        // Draw vertical lines
        svg.append("line")
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScale(quantiles.min))
            .attr("y2", yScale(quantiles.max))
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // Draw box
        svg.append("rect")
            .attr("x", x)
            .attr("y", yScale(quantiles.q3))
            .attr("width", boxWidth)
            .attr("height", yScale(quantiles.q1) - yScale(quantiles.q3))
            .attr("fill", "#0177b7")
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // Draw median line
        svg.append("line")
            .attr("x1", x)
            .attr("x2", x + boxWidth)
            .attr("y1", yScale(quantiles.median))
            .attr("y2", yScale(quantiles.median))
            .attr("stroke", "white")
            .attr("stroke-width", 2);
    });
});

// Prepare you data and load the data again. 
// This data should contains three columns, platform, post type and average number of likes. 
const socialMediaAvg = d3.csv("datacopy1.csv");

socialMediaAvg.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const 
      width = 600,
      height = 400;

    const margin = {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    };

    // Create the SVG container
    const svg = d3.select('#barplot')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', 'lightyellow');

    // Aggregate the data and reformat for easy
    const avgByGroup = d3.rollup(
        data,
        v => d3.mean(v, d => d.Likes),  
        d => d.Platform,                 
        d => d.PostType                  
    );

    const plotData = [];
    avgByGroup.forEach((postTypes, platform) => {
        postTypes.forEach((avgLikes, postType) => {
            plotData.push({
                Platform: platform,
                PostType: postType,
                avgLikes: avgLikes
            });
        });
    });
    

    // Define four scales
    // Scale x0 is for the platform, which divide the whole scale into 4 parts
    // Scale x1 is for the post type, which divide each bandwidth of the previous x0 scale into three part for each post type
    // Recommend to add more spaces for the y scale for the legend
    // Also need a color scale for the post type

    const x0 = d3.scaleBand()
      .domain([...new Set(data.map(d => d.Platform))])  
      .range([margin.left, width - margin.right])
      .padding(0.2);  
      

    const x1 = d3.scaleBand()
        .domain([...new Set(data.map(d => d.PostType))])  
        .range([0, x0.bandwidth()])  
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(plotData, d => d.avgLikes)])  
        .range([height - margin.bottom, margin.top + 50]);

    const color = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.PostType))])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);    
         
    // Add scales x0 and y     
    svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x0));  

    svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Platform");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Average Likes");


  // Group container for bars
    const barGroups = svg.selectAll("bar")
      .data(plotData)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${x0(d.Platform)},0)`);

  // Draw bars
    barGroups.append("rect")
      .attr("x", d => x1(d.PostType))              
      .attr("y", d => y(d.avgLikes))             
      .attr("width", x1.bandwidth())                
      .attr("height", d => y(0) - y(d.avgLikes))    
      .attr("fill", d => color(d.PostType)); 

    // Add the legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100 }, ${margin.top})`);

    const types = [...new Set(data.map(d => d.PostType))];
        
 
    types.forEach((type, i) => {
    legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(type));  
      legend.append("text")
          .attr("x", 20)
          .attr("y", i * 20 + 12)
          .text(type)
          .attr("alignment-baseline", "middle");
  });

});

// Prepare you data and load the data again. 
// This data should contains two columns, date (3/1-3/7) and average number of likes. 

const socialMediaTime = d3.csv("datacopy2.csv");

socialMediaTime.then(function(data) {
    // Create a date parser
    const parseDate = d3.timeParse("%m/%d/%Y");
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
        d.Date = parseDate(d.Date.split(" ")[0]);
    });

    // Define the dimensions and margins for the SVG
    const 
      width = 600,
      height = 400;

    const margin = {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    };

    // Create the SVG container
    const svg = d3.select('#lineplot')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', 'lightyellow');

    // Same rollup from the previous example, need to calculate likes per date
    const avgByDate = d3.rollup(
    data,
      v => d3.mean(v, d => d.Likes),  
      d => d.Date.getTime()        
);
    // Convert to array and sort by date
    const plotData = Array.from(avgByDate, ([date, avgLikes]) => ({
      Date: new Date(date),
      avgLikes: avgLikes})).sort((a, b) => a.Date - b.Date);

    // Set up scales for x and y axes  
    const xScale = d3.scaleTime()
      .domain(d3.extent(plotData, d => d.Date))  // Min to max date
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(plotData, d => d.avgLikes)])
      .range([height - margin.bottom, margin.top])

    // Draw the axis, you can rotate the text in the x-axis here
    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")  
      .attr("transform", "rotate(-45)")  
      .style("text-anchor", "end");  

    svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Date");

    // Add y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Average Likes");

    // Draw the line and path. Remember to use curveNatural.
    const line = d3.line()
      .x(d => xScale(d.Date))           
      .y(d => yScale(d.avgLikes))       
      .curve(d3.curveNatural);     
    svg.append("path")
      .datum(plotData)             
      .attr("fill", "none")        
      .attr("stroke", "#0177b7")   
      .attr("stroke-width", 2)     
      .attr("d", line);           

});
