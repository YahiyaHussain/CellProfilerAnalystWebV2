import React from 'react';
import { Row, Col, Container } from 'reactstrap';
import { Box, Button, Grid, IconButton, Menu, MenuItem, Card, TextField, Typography } from '@material-ui/core';
import logo from '../cpa_logo(blue).png';
import { Image, Dropdown, DropdownButton } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import { green } from '@material-ui/core/colors';
import Fab from '@material-ui/core/Fab';
import CheckIcon from '@material-ui/icons/Check';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Tooltip from '@material-ui/core/Tooltip';
//import UploadButton from './UploadButton'

import Evaluate from './AbbyUIButtons/UIEvaluateButton';
import ScoreAll from './UIScoreAllButton';
import { v4 as uuidv4 } from 'uuid';

import jones from '../jones.jpg';

import { GridContextProvider, GridDropZone, GridItem, swap, move } from 'react-grid-dnd';

import '../dndstyles.css';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';
import UploadButton from './UploadButton';

const useStyles = makeStyles(() => ({
	root: {
		display: 'flex',
		alignItems: 'center',
	},
	wrapper: {
		//margin: theme.spacing(1),
		position: 'relative',
	},
	buttonSuccess: {
		backgroundColor: green[500],
		'&:hover': {
			backgroundColor: green[700],
		},
	},
	fabProgress: {
		color: green[500],
		position: 'absolute',
		top: -6,
		left: -6,
		zIndex: 1,
	},
	buttonProgress: {
		color: green[500],
		position: 'absolute',
		top: '50%',
		left: '50%',
		marginTop: -12,
		marginLeft: -12,
	},
}));

function TestUIMVP() {
	// var classifierManager = null;
	// const [classifierManager, setClassifierManager] = React.useState(null)

	const [fetchButtonEnabled, setFetchButtonEnabled] = React.useState(false);
	const [trainButtonEnabled, setTrainButtonEnabled] = React.useState(false);
	const [evaluateButtonEnabled, setEvaluateButtonEnabled] = React.useState(false);
	const [downloadButtonEnabled, setDownloadButtonEnabled] = React.useState(false);
	const [uploadButtonEnabled, setUploadButtonEnabled] = React.useState(true);
	const [uploading, setUploading] = React.useState(false);
	const [success, setSuccess] = React.useState(false);
	const [openTrainDropdown, setOpenTrainDropdown] = React.useState(false);

	const [canvasWebWorker, setCanvasWebWorker] = React.useState(null);
	const [dataWebWorker, setDataWebWorker] = React.useState(null);
	const [classifierWebWorker, setClassifierWebWorker] = React.useState(null);
	const [dexieWebWorker, setDexieWebWorker] = React.useState(null);
	const [confusionMatrix, setConfusionMatrix] = React.useState([
		[0, 0],
		[0, 0],
	]);
	const [trainingObject, setTrainingObject] = React.useState(null);

	const trainingLossCanvasParentRef = React.useRef();

	React.useEffect(() => {
		const dexieWebWorker = constructWebWorker('../dexieWorker.js', 'dexieWebWorker');
		setDexieWebWorker(dexieWebWorker);
		const dataToCanvasWorkerChannel = new MessageChannel();
		const dataToClassifierWorkerChannel = new MessageChannel();

		const dataWebWorker = constructWebWorker('../dataWorker.js', 'dataWebWorker');
		dataWebWorker.postMessage({ action: 'connectToCanvasWorker' }, [dataToCanvasWorkerChannel.port1]);
		dataWebWorker.postMessage({ action: 'connectToClassifierWorker' }, [dataToClassifierWorkerChannel.port1]);
		setDataWebWorker(dataWebWorker);

		const canvasWebWorker = constructWebWorker('../canvasWorker.js', 'CanvasWebWorker');
		canvasWebWorker.postMessage({ action: 'connectToDataWorker' }, [dataToCanvasWorkerChannel.port2]);
		setCanvasWebWorker(canvasWebWorker);

		const classifierWebWorker = constructWebWorker('../classifierWorker.js', 'classifierWebWorker');
		classifierWebWorker.postMessage({ action: 'connectToDataWorker' }, [dataToClassifierWorkerChannel.port2]);
		setClassifierWebWorker(classifierWebWorker);
	}, []);

	const constructWebWorker = function (sourcePath, name) {
		const worker = new Worker(sourcePath);
		worker.addEventListener('error', (event) => {
			console.log(`[${name}] Error`, event.message, event);
		});
		return worker;
	};

	const classes = useStyles();
	const buttonClassname = clsx({
		[classes.buttonSuccess]: success,
	});

	const enableIterationButtons = () => {
		setFetchButtonEnabled(true);
		setTrainButtonEnabled(true);
		setDownloadButtonEnabled(true);
		setEvaluateButtonEnabled(true);
	};

	const trainSequencePromise = function (currentTrainingObject) {
		setOpenTrainDropdown(true);
		var UUID = null;
		let updateCanvasesListener = (event) => {
			if (UUID == event.data.uuid) {
				switch (event.data.action) {
					case 'updateTrainingCanvases':
						tfvis.show.history(trainingLossCanvasParentRef.current, event.data.trainLogs, [
							...event.data.ticks.loss,
							...event.data.ticks.accuracy,
						]);
						// tfvis.show.history(
						// 	trainingAccuracyCanvasParentRef.current,
						// 	event.data.trainLogs,

						// );
						break;
					default:
						console.log("didn't render bad action");
				}
			}
		};

		workerActionPromise(classifierWebWorker, 'startTrainingGraphsConnection', {})
			.then((event) => {
				UUID = event.data.uuid;
				classifierWebWorker.addEventListener('message', updateCanvasesListener);
				return workerActionPromise(classifierWebWorker, 'train', { trainingObject: currentTrainingObject });
			})
			.then(() => {
				workerActionPromise(classifierWebWorker, 'endTrainingGraphsConnection', {});
				classifierWebWorker.removeEventListener('message', updateCanvasesListener);
				return workerActionPromise(classifierWebWorker, 'confusionMatrix');
			})
			.then((event) => {
				const newConfusionMatrix = event.data.confusionMatrix;
				setConfusionMatrix(newConfusionMatrix);
			})
			.then(() => {
				setTrainingObject(currentTrainingObject);
				setOpenTrainDropdown(false);
			});
	};

	const workerActionPromise = function (worker, action, data) {
		const UUID = uuidv4();

		return new Promise((resolve) => {
			let selfDestructingEventHandler = (event) => {
				if (event.data.uuid === UUID) {
					worker.removeEventListener('message', selfDestructingEventHandler);
					resolve(event);
				}
			};
			worker.addEventListener('message', selfDestructingEventHandler);

			worker.postMessage({ action, ...data, uuid: UUID });
		});
	};

	const handleUpload = async (eventObject) => {
		console.log('Upload!');
		workerActionPromise(dexieWebWorker, 'init', { fileListObject: eventObject.target.files });
		setUploading(true);
		workerActionPromise(dataWebWorker, 'init', { fileListObject: eventObject.target.files })
			.then(() => {
				console.log('done');
				workerActionPromise(dataWebWorker, 'get', {
					getType: 'cellPairData',
					getArgs: { cellPair: { ImageNumber: 1, ObjectNumber: 1 } },
				});
			})
			.then(() => {
				console.log('next');
				return workerActionPromise(dataWebWorker, 'get', { getType: 'trainingObject' });
			})
			.then((event) => {
				const initialTrainingObject = event.data.getResult;
				return trainSequencePromise(initialTrainingObject);
			})
			.then(() => {
				setUploading(false);
				setSuccess(true);
				enableIterationButtons();
				setUploadButtonEnabled(false);
			});
	};

	return (
		<div style={{ overflowX: 'hidden', height: '100%', width: '100%' }}>
			<Row style={{ marginTop: '2%' }}>
				<Col style={{ left: '40%', right: 5 }}>
					<div className={classes.root}>
						<div className={classes.wrapper}>
							<Tooltip title="Load Data" aria-label="load data">
								<Fab
									aria-label="save"
									color="primary"
									component="label"
									className={buttonClassname}
									style={{ marginRight: 5 }}
								>
									{success ? <CheckIcon /> : <CloudUploadIcon />}
									<input
										type="file"
										hidden
										webkitdirectory="true"
										mozdirectory="true"
										msdirectory="true"
										odirectory="true"
										directory="true"
										multiple
										onChange={(eventObject) => {
											handleUpload(eventObject);
										}}
										disabled={!uploadButtonEnabled}
									/>
								</Fab>
							</Tooltip>
							{/* size={68}  */}
							{uploading && <CircularProgress className={classes.fabProgress} size={68} />}
						</div>
					</div>
				</Col>
			</Row>
		</div>
	);
}

export default TestUIMVP;
