import { select } from './optimal-select.js';

function attach() {
	console.log('attach');

	//Monitor input and textarea entered text
	const inputs = document.querySelectorAll('input, textarea');
	for (let i = 0; i < inputs.length; i++) {
		inputs[i].addEventListener('input', handleInput, true);
	}

	//Observe mutations of all elements to add monitors on inputs and textareas
	const observer = new MutationObserver(handleMutation);
	const config = {
		childList: true,
		subtree: true
	};

	const all = document.querySelectorAll('body *');
	for (let i = 0; i < all.length; i++) {
		observer.observe(all[i], config);
	}

	//Minitor value change on Select elements (like drop-down menu)
	const selects = document.querySelectorAll('select');
	for (let i = 0; i < selects.length; i++) {
		selects[i].addEventListener('change', handleChange,true); 
	}

	//Monitor click with selector
	document.body.addEventListener('click', handleClick,true);

	//Monitor form validation
	const forms = document.querySelectorAll('form');
	forms.forEach(form => form.addEventListener('submit', handleFormSubmit, true));
}

function handleMutation(mutations) {
	mutations.forEach(mutationRecord => {
		if (mutationRecord.type === 'childList') {
			let addedNodes = mutationRecord.addedNodes;
			for (let index = 0; index < addedNodes.length; index++) {
				let addedNode = addedNodes[index];
				if (addedNode.tagName) {
					const inputs = addedNode.querySelectorAll('input, textarea');
					for (let i = 0; i < inputs.length; i++) {
						inputs[i].addEventListener('input', handleInput);
					}
				}
			}
		}
	});
}

function handleFormSubmit(e){
	chrome.runtime.sendMessage({
		kind:'action',
		action: {
			type:'SubmitAction',
			selector: computeSelector(e.target)
		}
	});
}

function handleClick (e) {
	chrome.runtime.sendMessage({kind:'action', action: {type:'ClickAction', selector: computeSelector(e.target)} });
}

function handleInput(e) {
	chrome.runtime.sendMessage({
		kind:'action',
		action: {
			type:'TypeAction',
			selector: computeSelector(e.target),
			text: e.target.value
		}
	});
}

function handleChange(e) {
	chrome.runtime.sendMessage({
		kind:'action',
		action: {
			type:'SelectAction',
			selector: computeSelector(e.target),
			option: e.target.value
		}
	});
}

function computeSelector(el) {
	return computeSelectorOptimal(el);
}

function computeSelectorOptimal(el) {
	return select(el, {
		root: document,
		priority: ['id','class','href','src'],
		ignore: {
			class(className) {
				return (className==='class') || (className.indexOf('ng-') !== -1);
			}
		}
	});
}


attach();
