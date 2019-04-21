let convs;
let barWidth = 20;
let width = window.innerWidth;
let height = window.innerHeight - 10;

let currMonth = 8;
let currYear = 2015;

let rawConvs = [];
let currConvId = 0;
let lastConvId = 0;
let forwards = true;

let cloudD3 = null;

margin = ({top: 10, right: 10, bottom: 25, left: 40});

let svg = d3.select("body")
  .append("div")
  .classed("svg-container", true) //container class to make it responsive
  .append("svg")
  .attr("height", height)
  .attr("width", width)
  

  d3.json("./whatsapp/jsonText.json").then(
  (data, ii, columns) => {
    //Initialize data
    rawConvs = data;
    columns = rawConvs[0].names;
    console.log(rawConvs[0]);
    
    

    //Fixed labels
    var yearTitle = svg.append("text")
      .attr("class", "title")
      .attr("dy", ".71em")
      .attr("x", 80);

    var monthTitle = svg.append("text")
      .attr("class", "month")
      .attr("y", 110)
      .attr("x", 80);

    var convsTitle = svg.append("text")
      .attr("class", "convs")
      .attr("y", 140)
      .attr("x", 80);

    var cloudTitle = svg.append("text")
      .attr("class", "month")
      .attr("y", 340)
      .attr("x", width - 410);

    update()

    // Arrow key events
    window.focus();
    d3.select(window).on("keydown", function () {
      switch (d3.event.keyCode) {
        case 37:
          currMonth--;
          if(currMonth == -1){
            currYear--;
            currMonth = 11;
          }
          forwards = false;
          if(cloudD3 != null){
            cloudD3.remove()
            cloudTitle.text("")
          }
          update();
          break;
        case 39:
          currMonth++;
          if(currMonth == 12){
            currYear++;
            currMonth = 0;
          }
          forwards = true;
          if(cloudD3 != null){
            cloudD3.remove()
            cloudTitle.text("")
          }
          update();
          break;
      }
    });


    function update() {

      setCurrConvs()
      
      if(lastConvId > 0)
        convsD3.remove()

      setAxisAndColor()

      convsD3 = svg.append("g")
        .selectAll("g")
        .data(series)
        .join("g")
        .attr("fill", (d, i) => color(columns[i]))

      convD3 = convsD3.selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", (d, i) => x(moment(d.data.date).format("Do, hA")))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("click", (d,i) => {
          if(cloudD3 !== null)
            cloudD3.remove()
          drawWordCloud(rawConvs[currConvId + i].wordsArray, rawConvs[currConvId + i].wordsAmounts, moment(rawConvs[currConvId + i].date).format("Do, hA"))
        })
      
      yearTitle.text(currYear);

      monthTitle.text(moment(rawConvs[currConvId].date).format("MMMM"));
      
      convsTitle.text(currConvs.length + " conversations");

    }

    function setCurrConvs() {
      currConvs = sliceConvs().map(a => {
        let auxP = a.persons;
        auxP.date = a.date;
        return auxP;
      });

      series = d3.stack().keys(columns)(currConvs)
    }

    function setAxisAndColor(){
      if(lastConvId > 0){
        
        xAxisD3.remove()
        yAxisD3.remove()
      }

      color = d3.scaleOrdinal()
        .domain(series.map(d => d.key))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), series.length).reverse())
        .unknown("#ccc")

      x = d3.scaleBand()
        .domain(currConvs.map(d => moment(d.date).format("Do, hA")))
        .range([margin.left, width - margin.right])
        .padding(0.2)

      y = d3.scaleLinear()
        .domain([0, 300]) //d3.max(series, d => d3.max(d, d => d[1]))]
        .rangeRound([height - margin.bottom, margin.top])

      xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .call(g => g.selectAll(".domain").remove())

      yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, "s"))
        .call(g => g.selectAll(".domain").remove())
        
      xAxisD3 = svg.append("g")
        .call(xAxis);

      yAxisD3 = svg.append("g")
        .call(yAxis);

    }    

    function drawWordCloud(wordsArray, wordsAmounts, cloudTitleText) {

      var word_count = wordsAmounts;
      
      var words = wordsArray;
      
      var fill = d3.scaleOrdinal()
        .domain([0, 30])
        .range("schemeCategory20")
      
      var word_entries = d3.entries(word_count);

      var xScale = d3.scaleLinear()
        .domain([0, d3.max(word_entries, function (d) {
          return d.value;
        })])
        .range([0, 300]);

      cloudTitle
        .text(cloudTitleText);

      d3.layout.cloud().size([500, 300])
        .timeInterval(20)
        .words(word_entries)
        .fontSize(function (d) {
          return xScale(d.value / 2);
        })
        .text(function (d) {
          return d.key;
        })
        .rotate(function () {
          return ~~(Math.random() * 2) * 90;
        })
        .font("Impact")
        .on("end", draw)
        .start();

      function draw(words) {
        cloudD3 = svg.append("g")
          .attr("transform", "translate(" + [width - 300, 150] + ")")
          .selectAll("text")
          .data(words)
          .enter().append("text")
          .style("font-size", function (d) {
            return xScale(d.value/3) + "px";
          })
          .style("font-family", "Impact")
          .style("fill", d => fill(d.key.length))
          .attr("text-anchor", "middle")
          .attr("transform", function (d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
          })
          .text(function (d) {
            return d.key;
          });
      }

      d3.layout.cloud().stop();
    }

  }
);




function sliceConvs(){
  if(!forwards){
    currConvId = lastConvId;
    lastConvId--;
    
    
    
    while( moment(rawConvs[lastConvId].date).month() == currMonth ){
      lastConvId--;
    }
    lastConvId++;
    
    return rawConvs.slice(lastConvId, currConvId);
    
  } else {
    lastConvId = currConvId;
    
    while( moment(rawConvs[currConvId].date).month() == currMonth ){
      currConvId++;
    }
    return rawConvs.slice(lastConvId, currConvId);
    
  }
}






// drawWordCloud(text_string);
