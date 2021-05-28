import React from 'react';

import Fab from '@material-ui/core/Fab';
import { withStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

const NEWLINE_CHAR = 10;
const COMMA_CHAR = 44;

const DEBUG = true;
var dummy = null;
var TEXT_ENCODER = new TextDecoder();

function CsvBinarySearchDemo() {
	const [checkedState, setCheckedState] = React.useState(true);
	const [useGigaData, setUseGigaData] = React.useState(true);

	const handleUpload = async (eventObject) => {
		const csv_file = eventObject.target.files[0];
		if (csv_file === undefined) {
			return;
		}

		const csv_reader = csv_file.stream().getReader();

		// console.log('test getLastNewLineIndex:');
		// getFirstNewLineIndex(csv_file, 0, 5289 + 1).then((firstIndex) => {
		// 	getLastNewLineIndex(csv_file, 0, 5289 + 5289 + 500).then((lastIndex) => {
		// 		console.log(firstIndex, lastIndex);
		// 		csv_file
		// 			.slice(firstIndex, lastIndex)
		// 			.text()
		// 			.then((r) => console.log(r.slice(0, 20)));
		// 	});
		// });

		// get first line index to estimate window radius
		var byteIndex = 0;
		csv_reader
			.read()
			.then(function processText({ done, value: chunk }) {
				// javascript reads in byte chunks of a certain size each of which is a subset of the file
				for (var i = 0; i < chunk.length; i++) {
					if (chunk[i] === NEWLINE_CHAR) {
						return byteIndex;
					}
					byteIndex++;
				}
				return -1;
			})
			.then(async (firstNewLineIndex) => {
				// const IMAGENUMBER = 270;
				// const OBJECTNUMBER = 16;
				const startTime = performance.now();
				const binarySearch = async function (IMAGENUMBER, OBJECTNUMBER) {
					const window = firstNewLineIndex + 500;
					const windowRadius = Math.floor(window / 2);

					var lowIdx = 0;
					var hiIdx = csv_file.size - 1;
					var midIdx = Math.floor((lowIdx + hiIdx) / 2);
					var windowedLow_midIdx = midIdx - windowRadius;
					var windowedHi_midIdx = midIdx + windowRadius;
					// const newline_midIdx = getFirstNewLineIndex();
					var corrected_MidIdx = await getFirstNewLineIndex(csv_file, windowedLow_midIdx, windowedHi_midIdx);
					// console.log(`corrected_MidIdx: ${corrected_MidIdx}`);
					var ImageNumber = -1;
					var ObjectNumber = -1;

					const cellPairColIndex = useGigaData ? 1 : 0;

					// if (useGigaData) {
					// 	const cellPair = await extractFloatPairAtColIndex(csv_file, corrected_MidIdx, 1, window);
					// 	var ImageNumber = cellPair.ImageNumber;
					// 	var ObjectNumber = cellPair.ObjectNumber;
					// } else {
					// 	const cellPair = await extractFloatPairAtColIndex(csv_file, corrected_MidIdx, 0, window);
					// 	var ImageNumber = cellPair.ImageNumber;
					// 	var ObjectNumber = cellPair.ObjectNumber;
					// }

					// console.log('perobj', ImageNumber, ObjectNumber);
					ImageNumber = await extractFloatAtColIndex(csv_file, corrected_MidIdx, cellPairColIndex, window);

					// console.log(`ImageNumber: ${ImageNumber}`);
					var actualIsGreater = true;
					if (ImageNumber === IMAGENUMBER) {
						ObjectNumber = await extractFloatAtColIndex(
							csv_file,
							corrected_MidIdx,
							cellPairColIndex + 1,
							window
						);
						ObjectNumber = await extractFloatAtColIndex(
							csv_file,
							corrected_MidIdx,
							cellPairColIndex + 1,
							window
						);
						// console.log(`ObjectNumber: ${ObjectNumber}`);
						actualIsGreater = ObjectNumber < OBJECTNUMBER;
						// console.log(`ObjectNumber: ${ObjectNumber}`);
					} else {
						actualIsGreater = ImageNumber < IMAGENUMBER;
						// console.log(`ImageNumber: ${ImageNumber}`);
					}
					// console.log(`actualIsGreater: ${actualIsGreater}`);
					// var actualIsGreater =
					// 	ImageNumber === IMAGENUMBER ? ObjectNumber < OBJECTNUMBER : ImageNumber < IMAGENUMBER;

					const maxIterations = 100;
					var iterationsCount = 0;
					while (
						(IMAGENUMBER !== ImageNumber || OBJECTNUMBER !== ObjectNumber) &&
						iterationsCount++ < maxIterations
					) {
						if (actualIsGreater) {
							var lowIdx = corrected_MidIdx;
							var hiIdx = hiIdx;
						} else {
							var lowIdx = lowIdx;
							var hiIdx = corrected_MidIdx;
						}

						midIdx = Math.floor((lowIdx + hiIdx) / 2);

						var windowedLow_midIdx = midIdx - windowRadius;
						var windowedHi_midIdx = midIdx + windowRadius;
						// console.log(lowIdx, hiIdx, midIdx, windowRadius);
						// const newline_midIdx = getFirstNewLineIndex()
						var corrected_MidIdx = await getFirstNewLineIndex(
							csv_file,
							windowedLow_midIdx,
							windowedHi_midIdx
						);
						// console.log(`corrected_MidIdx: ${corrected_MidIdx}`);
						ImageNumber = await extractFloatAtColIndex(
							csv_file,
							corrected_MidIdx,
							cellPairColIndex,
							window
						);
						// console.log(`ImageNumber: ${ImageNumber}`);
						// ImageNumber = await extractFloatAtColIndex(
						// 	csv_file,
						// 	corrected_MidIdx,
						// 	cellPairColIndex,
						// 	window
						// );
						// console.log(`ImageNumber: ${ImageNumber}`);
						if (ImageNumber === IMAGENUMBER) {
							ObjectNumber = await extractFloatAtColIndex(
								csv_file,
								corrected_MidIdx,
								cellPairColIndex + 1,
								window
							);
							// console.log(`ObjectNumber: ${ObjectNumber}`);
							// ObjectNumber = await extractFloatAtColIndex(
							// 	csv_file,
							// 	corrected_MidIdx,
							// 	cellPairColIndex + 1,
							// 	window
							// );
							// console.log(`ObjectNumber: ${ObjectNumber}`);
							actualIsGreater = ObjectNumber < OBJECTNUMBER;
						} else {
							actualIsGreater = ImageNumber < IMAGENUMBER;
						}
						// console.log('perobj', ImageNumber, ObjectNumber);
					}
					// console.log(`iterationsCount: ${iterationsCount}`);
					// console.log(`ImageNumber,ObjectNumber: ${ImageNumber},${ObjectNumber}`);
				};

				// for (var i = 0; i < 1; i++) {
				// 	await binarySearch(270, 16);
				// }
				const promises = new Array(100).fill(0).map(() => binarySearch(270, 16));
				// console.log(promises);
				Promise.all(promises).then(() => {
					const endTime = performance.now();
					console.log('Time Took: ' + (endTime - startTime));
				});

				// await binarySearch(100, 1);
				// await binarySearch(10, 1);
			});
	};

	const getFirstNewLineIndex = function (fileObject, sliceStartIdx, sliceStopIdx) {
		const fileReader = fileObject.slice(sliceStartIdx, sliceStopIdx).stream().getReader();
		// console.log(sliceStopIdx - sliceStartIdx);
		var byteIndex = 0;
		// console.log('getFirstNewLineIndex');
		// const chunksizes = [];
		return fileReader
			.read()
			.then(function processText({ done, value: chunk }) {
				// chunksizes.push(chunk.length);
				if (done) {
					throw new Error("getFirstNewLineIndex: Can't find a newline");
				}
				// javascript reads in byte chunks of a certain size each of which is a subset of the file
				for (var i = 0; i < chunk.length; i++) {
					if (chunk[i] === NEWLINE_CHAR) {
						// console.log(chunksizes);
						return byteIndex;
					}
					byteIndex++;
				}

				return fileReader.read().then(processText);
			})
			.then((index) => sliceStartIdx + index);
	};

	const getLastNewLineIndex = function (fileObject, sliceStartIdx, sliceStopIdx) {
		const fileReader = fileObject.slice(sliceStartIdx, sliceStopIdx).stream().getReader();
		var lastNewLineIndex = -1;
		var byteIndex = 0;
		return fileReader
			.read()
			.then(function processText({ done, value: chunk }) {
				if (done) {
					if (lastNewLineIndex === -1) {
						throw new Error("getLastNewLineIndex: Can't find a newline");
					}
					return lastNewLineIndex;
				}
				// javascript reads in byte chunks of a certain size each of which is a subset of the file
				for (var i = 0; i < chunk.length; i++) {
					if (chunk[i] === NEWLINE_CHAR) {
						lastNewLineIndex = byteIndex;
					}
					byteIndex++;
				}

				return fileReader.read().then(processText);
			})
			.then((index) => sliceStartIdx + index);
	};

	const extractFloatAtColIndex = function (fileObject, lineIndex, colIndex, windowSize) {
		const fileReader = fileObject
			.slice(lineIndex, lineIndex + windowSize)
			.stream()
			.getReader();

		var commaCount = (colIndex <= 0 ? 0 : colIndex) + 1;
		var accumString = '';
		console.log('extractFloatAtColIndex');
		return fileReader.read().then(function processText({ done, value: chunk }) {
			// console.log(chunk.length, windowSize);
			if (done) {
				return null;
			}

			// javascript reads in byte chunks of a certain size each of which is a subset of the file
			for (var i = 0; i < chunk.length; i++) {
				if (i !== 0 && chunk[i] === NEWLINE_CHAR) {
					if (accumString.length > 0) {
						return Number(accumString);
					}
					return null;
				}
				if (chunk[i] === COMMA_CHAR) {
					if (commaCount === 0) {
						return Number(accumString);
					}
					commaCount--;
					continue;
				}
				if (commaCount === 1) {
					accumString += String.fromCharCode(chunk[i]);
				}
			}

			return fileReader.read().then(processText);
		});
	};

	const extractFloatAtColIndex_decoder = function (fileObject, lineIndex, colIndex, windowSize) {
		const fileReader = fileObject
			.slice(lineIndex, lineIndex + windowSize)
			.stream()
			.getReader();

		var commaCount = colIndex <= 0 ? 0 : colIndex;
		// var accumString = '';
		var startIndex = 0;
		const mustTrimComma = commaCount > 0 ? true : false;

		return fileReader.read().then(function processText({ done, value: chunk }) {
			if (done) {
				return null;
			}

			// javascript reads in byte chunks of a certain size each of which is a subset of the file
			for (var i = 0; i < chunk.length; i++) {
				if (i !== 0 && chunk[i] === NEWLINE_CHAR) {
					if (i - startIndex > 0) {
						const accumstring = TEXT_ENCODER.decode(chunk.slice(startIndex, i));
						// console.log(accumstring);
						// console.log(Number(accumstring));
						return Number(accumstring);
					}
					return null;
				}
				if (chunk[i] === COMMA_CHAR) {
					if (commaCount === 0) {
						const accumstring = TEXT_ENCODER.decode(chunk.slice(startIndex, i));
						// console.log(accumstring);
						// console.log(Number(accumstring));
						return Number(accumstring);
					}
					if (commaCount === 1) {
						if (mustTrimComma) {
							startIndex = i + 1;
						}
					}
					commaCount--;

					continue;
				}
			}

			return fileReader.read().then(processText);
		});
	};

	const extractFloatPairAtColIndex = function (fileObject, lineIndex, colIndex, windowSize) {
		const fileReader = fileObject
			.slice(lineIndex, lineIndex + windowSize)
			.stream()
			.getReader();

		var commaCount = (colIndex <= 0 ? 0 : colIndex) + 2;
		var accumString1 = '';
		var accumString2 = '';
		return fileReader.read().then(function processText({ done, value: chunk }) {
			if (done) {
				return null;
			}

			// javascript reads in byte chunks of a certain size each of which is a subset of the file
			for (var i = 0; i < chunk.length; i++) {
				if (i !== 0 && chunk[i] === NEWLINE_CHAR) {
					if (accumString1.length > 0 && accumString2.length > 0) {
						return { ImageNumber: Number(accumString1), ObjectNumber: Number(accumString2) };
					}
					return null;
				}
				if (chunk[i] === COMMA_CHAR) {
					if (commaCount === 0) {
						if (accumString1.length > 0 && accumString2.length > 0) {
							return { ImageNumber: Number(accumString1), ObjectNumber: Number(accumString2) };
						}
						return null;
					}
					commaCount--;
					continue;
				}
				if (commaCount === 2) {
					accumString1 += String.fromCharCode(chunk[i]);
				}
				if (commaCount === 1) {
					accumString2 += String.fromCharCode(chunk[i]);
				}
			}

			return fileReader.read().then(processText);
		});
	};

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

export default CsvBinarySearchDemo;
