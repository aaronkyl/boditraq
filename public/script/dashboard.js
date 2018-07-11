$(document).ready(function() {
    $('select').change(function() {
        window.location.replace('/dashboard?units=' + $('select').val());
    });
    
    var ctx = document.getElementById("resultsChart");
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
            datasets: [{
                label: '# of Votes',
                borderColor: '#D34F56',
                fill: false,
                data: [12, 10, , 5, 2, 3],
                yAxisID: 'y-axis-1'
            },
            {
                label:'other',
                borderColor: '#818B43',
                fill: false,
                data:[null, null, 5,6,7,2],
                yAxisID: 'y-axis-2'
            }]
        },
        options: {
            spanGaps: true,
            scales: {
                yAxes: [{
							type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
							display: true,
							position: 'left',
							id: 'y-axis-1',
						}, {
							type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
							display: true,
							position: 'right',
							id: 'y-axis-2',

							// grid line settings
							gridLines: {
								drawOnChartArea: true, // only want the grid lines for one axis to show up
							},
						}]
            }
        }
    });
});