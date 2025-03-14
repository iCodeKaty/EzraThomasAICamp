import { contentFilterText, stopAtLastPeriod, removeBlankLines } from "./content-filter.js";
import { hugging_face_key } from "./keys.js";

const submitButton = document.querySelector(".submit-btn");
const entry = document.querySelector(".image-gen-entry");
const textFrame = document.querySelector(".text-frame");
const downloadButton = document.querySelector(".download-btn");
const downloadableLink = document.querySelector(".download-link");

let records = [];

async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct",
		{
			headers: { Authorization:  `Bearer ${hugging_face_key}` , "Content-Type": "application/json"},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({"inputs": "Can you please let us know more details about your "}).then((response) => {
	console.log(JSON.stringify(response));
});

downloadButton.addEventListener('click', () => {
    const filename = "records.txt";
    let conversation = "";
    if (records.length > 0) {
        records.forEach(record => {
            conversation += record + '\n' + '\n';
        });

        const blob = new Blob([conversation], {
            type: 'text/plain;charset=utf-8'
        });
        downloadableLink.download = filename;
        downloadableLink.href = window.URL.createObjectURL(blob);
    }
})


submitButton.addEventListener('click', () => {
    submit();
});

async function submit() {
    const input = entry.value;
    if (input != "") {
        let contentValue = await contentFilterText(input);
        if (contentValue == 1) {
            query({ "inputs": input, "parameters": { "return_full_text": false } }).then(async (response) => {
                let aiContentValue = await contentFilterText(response[0].generated_text);
                if (aiContentValue == 1) {
                    let AIResult = response[0].generated_text

                    const userinput = document.createElement('p')
                    const aiOutput = document.createElement('p')

                    userinput.classList.add("user-bubble")
                    aiOutput.classList.add("ai-bubble")

                    let cutoff = stopAtLastPeriod(AIResult)

                    userinput.innerHTML = input
                    aiOutput.innerHTML = cutoff
                    textFrame.appendChild(userinput)
                    textFrame.appendChild(aiOutput)

                    textFrame.scrollTop = textFrame.scrollHeight
                    entry.value = ''
                    entry.placeholder = "Ask me a question..."

                    let noBlankLines = removeBlankLines(cutoff)
                    records.push("User: " + userinput.innerHTML)
                    records.push("AI: " + noBlankLines)   
                } else {
                    setPlaceholder(aiContentValue);
                }
            });
        } else {
            setPlaceholder(contentValue);

        }

    }

}


function setPlaceholder(cv) {
    if (cv == 0) {
        entry.value = "";
        entry.placeholder = "Please be appropriate!";
    } else {
        entry.value = "";
        entry.placeholder = "There has been an error.";
    }
}


