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

		const test2 = function (chunkMB) {
			return new Promise((resolve) => {
				let results = [];
				let count = 0;

				const CHUNK_SIZE = chunkMB * 1024 * 1024;

				// console.log(Math.floor(csv_file.size / CHUNK_SIZE));

				const NUMBER_OF_WORKERS = navigator.hardwareConcurrency;
				const NUMBER_OF_CHUNKS = Math.floor(csv_file.size / CHUNK_SIZE) + 1;

				const workerSlicesAssignments = Array(NUMBER_OF_WORKERS)
					.fill(null)
					.map((e) => []);
				for (let chunk_index = 0; chunk_index < NUMBER_OF_CHUNKS; chunk_index++) {
					let currentWorkerIndex = Math.floor((chunk_index / NUMBER_OF_CHUNKS) * NUMBER_OF_WORKERS);
					currentWorkerIndex =
						currentWorkerIndex < NUMBER_OF_WORKERS ? currentWorkerIndex : NUMBER_OF_WORKERS - 1;
					// console.log(currentWorkerIndex);
					const startIndex = chunk_index * CHUNK_SIZE;
					const stopIndex = startIndex + CHUNK_SIZE;
					const slice = { startIndex, stopIndex };
					// console.log(slice);

					workerSlicesAssignments[currentWorkerIndex].push(slice);
				}
				console.log(workerSlicesAssignments);
				for (let workerIndex = 0; workerIndex < NUMBER_OF_WORKERS; workerIndex++) {
					const workerName = workerIndex;
					const newLineWorker = new Worker('../newlineWorker.js');
					newLineWorker.addEventListener('error', (event) => {
						console.log(`[${workerName}] Error`, event.message, event);
					});

					let selfDestructingEventHandler = (event) => {
						newLineWorker.removeEventListener('message', selfDestructingEventHandler);
						newLineWorker.terminate();
						count++;
						results[workerIndex] = new Uint32Array(event.data);
						// console.log(count);
						if (count === NUMBER_OF_WORKERS) {
							const numNewlines = results.reduce((acc, e) => acc + e.length, 0);
							const newLines = [];
							for (let i = 0; i < results.length; i++) {
								for (let j = 0; j < results[i].length; j++) {
									newLines.push(results[i][j]);
								}
							}

							// console.log(newLines);
							resolve();
						}
					};
					newLineWorker.addEventListener('message', selfDestructingEventHandler);
					newLineWorker.postMessage({
						file: csv_file,
						slices: workerSlicesAssignments[workerIndex],
					});
				}
			});
			//
		};

		const test1 = async function (chunkMB) {
			const CHUNK_SIZE = chunkMB * 1024 * 1024;
			console.log('chunking by mb: ' + chunkMB);
			const promises = [];
			const startNewLineProcessing = performance.now();
			for (var chunk_index = 0; chunk_index < csv_file.size; chunk_index += CHUNK_SIZE) {
				const p = new Promise((resolve) => {
					const myChunkIndex = chunk_index;
					const fileReader = new FileReader();
					const sliced_file = csv_file.slice(myChunkIndex, myChunkIndex + CHUNK_SIZE);
					const newlineIndices = [];
					fileReader.onload = function () {
						const buffer = new Uint8Array(fileReader.result);
						for (var buffer_index = 0; buffer_index < buffer.length; buffer_index++) {
							if (buffer[buffer_index] === NEWLINE_CHAR) {
								newlineIndices.push(myChunkIndex + buffer_index);
							}
						}
						// console.log('finished: ' + myChunkIndex);
						resolve(newlineIndices);
					};
					fileReader.readAsArrayBuffer(sliced_file);
				});
				promises.push(p);
			}

			return Promise.all(promises).then((newlineIndicesArray) => {
				// console.log(newlineIndicesArray.reduce((e1, e2) => e1.concat(e2)));
			});
		};
		var startNewLineProcessing = performance.now();
		// await test1(24);
		// console.log(`main Finished in: ${(performance.now() - startNewLineProcessing) / 1000} seconds`);
		// startNewLineProcessing = performance.now();
		// await test2(24);
		// console.log(`worker Finished in: ${(performance.now() - startNewLineProcessing) / 1000} seconds`);
		// startNewLineProcessing = performance.now();
		// await test1(20);
		// console.log(`main Finished in: ${(performance.now() - startNewLineProcessing) / 1000} seconds`);
		// startNewLineProcessing = performance.now();
		await test2(20);
		console.log(`worker Finished in: ${(performance.now() - startNewLineProcessing) / 1000} seconds`);
		startNewLineProcessing = performance.now();
		// await test1(16);
		// console.log(`main Finished in: ${(performance.now() - startNewLineProcessing) / 1000} seconds`);
		// startNewLineProcessing = performance.now();
		// await test2(16);
		// console.log(`worker Finished in: ${(performance.now() - startNewLineProcessing) / 1000} seconds`);
		// await test(4);
		// for (var i = 8; i < 64; i += 8) {
		// 	await test(i);
		// }
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
