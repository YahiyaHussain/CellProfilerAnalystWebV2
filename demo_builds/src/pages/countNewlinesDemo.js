import React from 'react';

import Fab from '@material-ui/core/Fab';
import { withStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

const NEWLINE_CHAR = 10;

function CountNewlinesDemo() {
	const [checkedState, setCheckedState] = React.useState(true);
	const [useGigaData, setUseGigaData] = React.useState(true);

	//For giga dataset use "Files" tab at the bottom of this page and get a "Plate..." file
	// gunzip it and get the folder and pass in the .sql file in the Extracted Features folder which
	// is converted to a csv file http://gigadb.org/dataset/view/id/100351/
	//For the per_object.csv use this link and just pass in the per_object.csv http://d1zymp9ayga15t.cloudfront.net/content/Examplezips/cpa_2.0_example.zip
	const handleUpload = async (eventObject) => {
		// upload a single file which is a csv
		const csv_file = eventObject.target.files[0];
		if (csv_file === undefined) {
			return;
		}
		console.log('file found:', csv_file);

		const csv_reader = csv_file.stream().getReader();

		// keeps track of the current line in the file
		var lineIndex = 0;
		var newLineIndices = [];

		const timeBeforeParsingNewlines = performance.now();
		csv_reader
			.read()
			.then(function processText({ done, value: chunk }) {
				if (done) {
					console.log(`stream complete with ${newLineIndices.length} lines`);
					const timeFinished = performance.now();
					console.log(`Newline parsing took ${timeFinished - timeBeforeParsingNewlines} milliseconds.`);
					console.log(newLineIndices);
					const diffs = new Array(newLineIndices.length - 1).fill(0);
					for (var i = 0; i < newLineIndices.length - 1; i++) {
						diffs[i] = newLineIndices[i] - newLineIndices[i + 1];
					}
					console.log(diffs);
					return newLineIndices;
				}
				// javascript reads in byte chunks of a certain size each of which is a subset of the file
				for (var i = 0; i < chunk.length; i++) {
					if (chunk[i] === NEWLINE_CHAR) {
						newLineIndices.push(lineIndex);
					}
					lineIndex++;
				}

				return csv_reader.read().then(processText);
			})
			.then((newLineIndices) => {
				const index = Math.floor(newLineIndices.length / 2);
				var timeBeforeExtractingLines = performance.now();

				// extraction function which reads a line and parses it into  an array of floats
				const makeLineBlobPromise = function (index) {
					const lineBlob = csv_file.slice(newLineIndices[index], newLineIndices[index + 1]);
					// gigadata has a table id string before the rest of the number data
					// whereas per_object.csv does not
					if (useGigaData) {
						return lineBlob.text().then((r) => {
							return r
								.trim('\n')
								.split(',')
								.map((e, i) => (i == 0 ? e : Number(e)));
						});
					} else {
						return lineBlob.text().then((r) => {
							return r
								.trim('\n')
								.split(',')
								.map((e, i) => Number(e));
						});
					}
				};

				// take the middle of the csv and extract 100 lines from there
				Promise.all(new Array(100).fill().map((e, i) => makeLineBlobPromise(index + i))).then((r) => {
					const timeFinished = performance.now();
					console.log(`line extracting took ${timeFinished - timeBeforeExtractingLines} milliseconds.`);
					console.log(r);
				});
			});
	};

	// some material ui theme I copied just cause
	const AntSwitch = withStyles((theme) => ({
		root: {
			width: 28,
			height: 16,
			padding: 0,
			display: 'flex',
		},
		switchBase: {
			padding: 2,
			color: theme.palette.grey[500],
			'&$checked': {
				transform: 'translateX(12px)',
				color: theme.palette.common.white,
				'& + $track': {
					opacity: 1,
					backgroundColor: theme.palette.primary.main,
					borderColor: theme.palette.primary.main,
				},
			},
		},
		thumb: {
			width: 12,
			height: 12,
			boxShadow: 'none',
		},
		track: {
			border: `1px solid ${theme.palette.grey[500]}`,
			borderRadius: 16 / 2,
			opacity: 1,
			backgroundColor: theme.palette.common.white,
		},
		checked: {},
	}))(Switch);

	// I want to keep track of if the user wants to parse the giga data
	const handleChange = function () {
		setCheckedState(!checkedState);
		setUseGigaData(!useGigaData);

		console.log(!checkedState);
	};

	return (
		<div>
			<Fab aria-label="save" color="primary" component="label">
				upload csv
				<input type="file" hidden onChange={handleUpload} />
			</Fab>
			<Typography component="div">
				<Grid component="label" container alignItems="center" spacing={1}>
					<Grid item>use per_object</Grid>
					<Grid item>
						<AntSwitch checked={checkedState} onChange={handleChange} name="checkedC" />
					</Grid>
					<Grid item>use giga data</Grid>
				</Grid>
			</Typography>
		</div>
	);
}

export default CountNewlinesDemo;
