function initMap() {
    // Initialize the map centered on the US
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: {lat: 37.0902, lng: -95.7129},  // Center the map on the US
        mapTypeId: 'roadmap'
    });

    // Google Maps Geocoding API URL
    const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=';

    // Fetch and parse the CSV file
    Papa.parse('Sales by States.csv', {
        download: true,
        header: true,
        complete: function(results) {
            console.log("Parsed CSV Data:", results.data); // Debugging log

            results.data.forEach(function(item) {
                var state = item.State;
                var sales = item.Sales;

                // Debugging log for each state and sales
                console.log("Processing state:", state, "Sales:", sales);

                // Check if sales data is defined and not empty
                if (sales && sales.trim() !== "") {
                    // Remove $ sign and commas, then parse as a float
                    sales = parseFloat(sales.replace(/[$,]/g, ''));

                    if (!isNaN(sales)) {
                        // Get the latitude and longitude for each state using the Geocoding API
                        fetch(geocodeUrl + encodeURIComponent(state) + '&key=AIzaSyCFkCZbfL_zFHU7iPP3_29-nhjt9JQqijA')
                            .then(response => response.json())
                            .then(data => {
                                if (data.status === 'OK') {
                                    var latLng = data.results[0].geometry.location;

                                    // Create a marker for each state
                                    var marker = new google.maps.Marker({
                                        position: latLng,
                                        map: map,
                                        title: `${state}: $${sales}`
                                    });

                                    // When the marker is clicked, show a histogram of sales data
                                    marker.addListener('click', function() {
                                        showHistogram(state, sales, marker.getPosition());
                                    });
                                } else {
                                    console.error(`Geocoding API error for ${state}: ${data.status}`);
                                }
                            })
                            .catch(error => console.error('Error fetching geocoding data:', error));
                    } else {
                        console.error(`Invalid sales data for ${state}: ${item.Sales}`);
                    }
                } else {
                    console.error(`Sales data is undefined or empty for ${state}`);
                }
            });
        },
        error: function(error) {
            console.error('Error parsing CSV file:', error);
        }
    });
}

// Function to display a histogram of sales data
function showHistogram(state, sales, position) {
    // Load the Google Charts library
    google.charts.load('current', {packages: ['corechart']});
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        var data = google.visualization.arrayToDataTable([
            ['State', 'Sales'],
            [state, sales]
        ]);

        var options = {
            title: `Sales Data for ${state}`,
            legend: { position: 'none' },
            hAxis: {
                title: 'State',
                minValue: 0
            },
            vAxis: {
                title: 'Sales',
                format: 'decimal'
            },
            bars: 'vertical',  // Required for Material Bar Charts
            annotations: {
                alwaysOutside: true,
                textStyle: {
                    fontSize: 12,
                    color: '#000',
                    auraColor: 'none'
                }
            }
        };

        var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
        chart.draw(data, options);

        // Position the chart div relative to the map
        var chartDiv = document.getElementById('chart_div');
        var projection = map.getProjection();
        var point = projection.fromLatLngToPoint(position);
        var x = point.x * Math.pow(2, map.getZoom());
        var y = point.y * Math.pow(2, map.getZoom());

        chartDiv.style.left = `${x - chartDiv.offsetWidth / 2}px`;
        chartDiv.style.top = `${y - chartDiv.offsetHeight - 10}px`;
        chartDiv.style.display = 'block';
    }
}
