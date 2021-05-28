const NEWLINE_CHAR = 10;
self.onmessage = async (message) => {
	const startNewLineProcessing = performance.now();
	const file = message.data.file;
	const slices = message.data.slices;
	// console.log(slices);
	const promises = [];
	// for (let i = 0; i < slices.length; i++) {
	// 	const p = new Promise((resolve) => {
	// 		const fileReader = new FileReader();
	// 		const sliced_file = file.slice(slices[i].startIndex, slices[i].stopIndex);
	// 		// console.log(slices[i].startIndex, slices[i].stopIndex);
	// 		const newlineIndices = [];
	// 		fileReader.onload = function () {
	// 			const buffer = new Uint8Array(fileReader.result);
	// 			for (let buffer_index = 0; buffer_index < buffer.length; buffer_index++) {
	// 				if (buffer[buffer_index] === NEWLINE_CHAR) {
	// 					newlineIndices.push(slices[i].startIndex + buffer_index);
	// 				}
	// 			}
	// 			resolve(newlineIndices);
	// 		};
	// 		fileReader.readAsArrayBuffer(sliced_file);
	// 	});
	// 	promises.push(p);
	// }
	const whole_slice = file.slice(slices[0].startIndex, slices[slices.length - 1].stopIndex);
	const reader = whole_slice.stream().getReader();
	var newLineIndices = [];
	var lineIndex = 0;
	reader
		.read()
		.then(function processText({ done, value: chunk }) {
			if (done) {
				// console.log(`stream complete with ${newLineIndices.length} lines`);
				const timeFinished = performance.now();
				// console.log(`Newline parsing took ${timeFinished - startNewLineProcessing} milliseconds.`);
				// console.log(newLineIndices);
				return newLineIndices;
			}
			// javascript reads in byte chunks of a certain size each of which is a subset of the file
			for (var i = 0; i < chunk.length; i++) {
				if (chunk[i] === NEWLINE_CHAR) {
					newLineIndices.push(lineIndex);
				}
				lineIndex++;
			}

			return reader.read().then(processText);
		})
		.then((newLineIndices) => {
			const numBufferBytes = newLineIndices.length * 4;
			const buffer = new ArrayBuffer(numBufferBytes);
			const bufferView = new Uint32Array(buffer);
			for (let i = 0; i < bufferView.length; i++) {
				bufferView[i] = newLineIndices[i];
			}
			// console.log('processing finished: ' + (performance.now() - startNewLineProcessing));
			// const postmessagestart = performance.now();
			self.postMessage(buffer);
		});
	// return Promise.all(promises).then((newlineIndicesArray) => {
	// 	const numBufferBytes = newlineIndicesArray.reduce((acc, curr) => acc + curr.length * 4, 0);
	// 	const newLines = newlineIndicesArray.reduce((e1, e2) => e1.concat(e2));
	// 	const buffer = new ArrayBuffer(numBufferBytes);
	// 	const bufferView = new Uint32Array(buffer);
	// 	for (let i = 0; i < bufferView.length; i++) {
	// 		bufferView[i] = newLines[i];
	// 	}
	// 	// console.log('processing finished: ' + (performance.now() - startNewLineProcessing));
	// 	const postmessagestart = performance.now();
	// 	self.postMessage(buffer);
	// 	// console.log('postmessage time: ' + (performance.now() - postmessagestart));
	// });
};
