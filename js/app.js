const currencyUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';
//const convertUrl = 'https://free.currencyconverterapi.com/api/v5/convert?q=USD_PHP&compact=y';
const selectFrom = document.querySelector('#sourceFrom');
const selectTo = document.querySelector('#sourceTo');
const amount = document.querySelector('#amt');
const goButton = document.querySelector('#btn');
const fromDisp = document.querySelector('#from');
const toDisp = document.querySelector('#to');
const Disp = document.querySelector('#display');
const rate = document.querySelector('#unit-rate');
const curDisp = document.querySelector('#currency');
window.addEventListener('load', () =>{
if('serviceWorker' in navigator){
	try{
		navigator.serviceWorker.register('./sw.js')
	}
	catch(e){
		console.log('Error');
	}

	this.db = idb.open('currency-converter', 1, (upgradeDb) =>{
		upgradeDb.createObjectStore('currency', {keyPath: 'id'})
		upgradeDb.createObjectStore('exchangeRates');

	})
}
addCurrency();
});

function addCurrency(){
	fetch(currencyUrl).then((response) =>{
		return response.json();
	})
	.then(function(datas){
		for (const key of Object.keys(datas.results)){
    			this.db.then((db) =>{
   		 if(!db) return;
    	 const tx = db.transaction('currency', 'readwrite');
    	 const store = tx.objectStore('currency');
    		store.put(datas.results[key]);
    	})
    	//Displaying the currencies to the select form
    	selectFrom.innerHTML = selectFrom.innerHTML + '<br>' + displaySelectTemplate(datas.results[key]);
    	selectTo.innerHTML = selectTo.innerHTML + '<br>' + displaySelectTemplate(datas.results[key]);
		}
	})
	.catch(() =>{
		this.db.then((db) =>{
			if(!db) return;
			const tx = db.transaction('currency');
			const store = tx.objectStore('currency');
			store.getAll().then((datas) =>{
				for(data of datas){
    				selectFrom.innerHTML = selectFrom.innerHTML + '<br>' + displaySelectTemplate(data);
    				selectTo.innerHTML = selectTo.innerHTML + '<br>' + displaySelectTemplate(data);
				}
			})
		})
	})
}
function displaySelectTemplate(data){
	return `<option id='${data.id}' value="${data.id}">${data.id} - ${data.currencyName}</option>`;	
}
goButton.addEventListener('click', () =>{
	const fromCurrency = selectFrom.value;
	const toCurrency = selectTo.value;
	const amtConv = amount.value;
	const conv = `${fromCurrency}_${toCurrency}`;
	const rconv = `${toCurrency}_${fromCurrency}`;
	const nameCurrencyFrom = document.querySelector(`#${fromCurrency}`).innerHTML;
	const nameCurrencyTo = document.querySelector(`#${toCurrency}`).innerHTML;
	//setting the fetch url of the required currency
	const url = `https://free.currencyconverterapi.com/api/v5/convert?q=${conv}&compact=y`;
	//Fetching convertion rate from url using the required currencys
	fetch(url).then((response) =>{
		return response.json();
	})
	.then((data) =>{
		const res = convert(amtConv, data[`${conv}`].val)
					.toFixed(2)
					.replace(/\d(?=(\d{3})+\.)/g, '$&,');
		fromDisp.innerHTML = `${amtConv} ${fromCurrency} =`;
		toDisp.innerHTML = `${res} ${toCurrency}`;
		curDisp.innerHTML = `<p>${nameCurrencyFrom} <-> ${nameCurrencyTo}</p>`;
		rate.innerHTML = `
				<p>1 ${fromCurrency} = ${data[`${conv}`].val} ${toCurrency} <-> 1 ${toCurrency} = ${1 / data[`${conv}`].val} ${fromCurrency}</p>`;
		Disp.style.display = 'block';
		this.db.then((db) =>{
			if(!db) return;

			const trans = db.transaction('exchangeRates', 'readwrite');
			const exStore = trans.objectStore('exchangeRates');

			exStore.put(data[`${conv}`].val, conv);
			exStore.put((1 / data[`${conv}`].val), rconv);


		});

	})
	.catch(function(){
		this.db.then(function(db){
			if(!db) return;
			const trans = db.transaction('exchangeRates', 'readwrite');
			const exStore = trans.objectStore('exchangeRates');
			return exStore.openCursor();
		}).then(function changeCursor(cursor){
			//if the is no cursor do nothing
			if(!cursor) return;
			//if the current cursor key is not same as the conversion rate change to next cursor
			if(cursor.key != conv){
				return cursor.continue().then(changeCursor)
			}
			const eRate = cursor.value;
			const res = convert(amtConv, eRate)
						.toFixed(2)
				.replace(/\d(?=(\d{3})+\.)/g, '$&,');
			fromDisp.innerHTML = `${amtConv} ${fromCurrency} =`;
			toDisp.innerHTML = `${res} ${toCurrency}`;
			curDisp.innerHTML = `<p>${nameCurrencyFrom} <-> ${nameCurrencyTo}</p>`;
			rate.innerHTML = `
					<p>1 ${fromCurrency} = ${eRate} ${toCurrency} <-> 1 ${toCurrency} = ${1 / eRate} ${fromCurrency}</p>
				   `;
			Disp.style.display = 'block';
		})
	})
});

function convert(amt, cVal){
	return amt * cVal;
}