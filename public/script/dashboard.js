$(document).ready(function() {
    $('select').change(function() {
        window.location.replace('/dashboard?units=' + $('select').val());
    });
    
    var datasets = $('#chartData').data().other.datasets;
    var labels = $('#chartData').data().other.labels;
    
    console.log('datasets: ', datasets);
    
    var ctx = document.getElementById("resultsChart");
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            spanGaps: true,
            responsive: true,
            hoverMode: 'index',
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
					type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'left',
					id: 'y-axis-weight',
					ticks: {
                      fontColor: "#959595", // this here
                    },
				}, {
					type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'right',
					id: 'y-axis-length',

					// grid line settings
					gridLines: {
						drawOnChartArea: false, // only want the grid lines for one axis to show up
					},
					ticks: {
                      fontColor: "#959595", // this here
                    },
				}],
				xAxes : [{
				    ticks: {
                      fontColor: "#959595", // this here
                    }
				}]
            },
            legend: {
                display: true,
                labels: {
                    fontColor: '#959595'
                }
            }
        }
    });
});