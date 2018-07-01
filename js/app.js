const currencyUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';
const countryUrl = 'https://free.currencyconverterapi.com/api/v5/countries';
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
const btnInstall = document.querySelector('#btnAdd');


window.addEventListener('load', (e) => {
if('serviceWorker' in navigator){

	navigator.serviceWorker.register('./sw.js')

			 .then((reg) => {

			 	console.log("serviceWorker registered successfully");

			 })

			 .catch((e)=>{

			 	console.log("Could not register service worker", e)
			 	
			 });

	this.db = idb.open('currency-converter', 1, function(upgradeDb){

				upgradeDb.createObjectStore('currency', {keyPath: 'id'})

				upgradeDb.createObjectStore('exchangeRates');

	})
}

	addCurrency();
});

function addCurrency(){

	fetch(currencyUrl).then(function(response){	

		return response.json();

	}).then(function(datas){

		for (const key of Object.keys(datas.results)) {
    		//console.log(key, datas.results[key]); 

    		//Storing the fetched currencies in the database
    		this.db.then(function(db){

    			if(!db) return;

    			const tx = db.transaction('currency', 'readwrite');
    			const store = tx.objectStore('currency');

    			//console.log('putting items into the currency converter store');

    			store.put(datas.results[key]);

    		})

    		//Displaying the currencies to the select form
    		selectFrom.innerHTML = selectFrom.innerHTML +'<br>'+displaySelectTemplate(datas.results[key]);
    		selectTo.innerHTML = selectTo.innerHTML +'<br>'+displaySelectTemplate(datas.results[key]);

		}
	}).catch(function(err){

		console.log('Error fetching currency from the server');

		this.db.then(function(db){

			if(!db) return;

			const tx = db.transaction('currency');
			const store = tx.objectStore('currency');

			store.getAll().then(function(datas){

				for(data of datas){
					//console.log(data);
    				selectFrom.innerHTML = selectFrom.innerHTML +'<br>'+displaySelectTemplate(data);
    				selectTo.innerHTML = selectTo.innerHTML +'<br>'+displaySelectTemplate(data);

				}

			})
		})
	})
}

function displaySelectTemplate(data){

return `<option id='${data.id}' value="${data.id}">${data.id} - ${data.currencyName}</option>`;	

}

goButton.addEventListener('click', () => {

	//selecting the different form fields
	const fromCurrency = selectFrom.value;
	const toCurrency = selectTo.value;
	const amtConv = amount.value;
	const conv = `${fromCurrency}_${toCurrency}`;
	const rconv = `${toCurrency}_${fromCurrency}`;
	const name_currency_from = document.querySelector(`#${fromCurrency}`).innerHTML;
	const name_currency_to = document.querySelector(`#${toCurrency}`).innerHTML;


	//setting the fetch url of the required currency
	let url = `https://free.currencyconverterapi.com/api/v5/convert?q=${conv}&compact=y`;

	//Fetching convertion rate from url using the required currencys
	fetch(url).then(function(response){

		return response.json();

	}).then(function(data){

		//console.log(data);


		const res = convert(amtConv, data[`${conv}`].val).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

		fromDisp.innerHTML = `${amtConv} ${fromCurrency} =`;

		toDisp.innerHTML = `${res} ${toCurrency}`;
		
		curDisp.innerHTML = `<p>${name_currency_from} <-> ${name_currency_to}</p>`;
		
		rate.innerHTML = `
				<p>1 ${fromCurrency} = ${data[`${conv}`].val} ${toCurrency} <-> 1 ${toCurrency} = ${1 / data[`${conv}`].val} ${fromCurrency}</p>
			   `;

		Disp.style.display = 'block';

		this.db.then(function(db){

			if(!db) return;

			const trans = db.transaction('exchangeRates', 'readwrite');
			const exStore = trans.objectStore('exchangeRates');

			console.log('Storing exchange rate for offline use');

			exStore.put(data[`${conv}`].val, conv);
			exStore.put((1 / data[`${conv}`].val), rconv);


		});

	}).catch(function(err){

		console.log('Error fetching conversion rate');

		this.db.then(function(db){

			if(!db) return;

			const trans = db.transaction('exchangeRates', 'readwrite');
			const exStore = trans.objectStore('exchangeRates');

			console.log('Using stored exchange rates');
			
			return exStore.openCursor();

		}).then(function changeCursor(cursor){

			//if the is no cursor do nothing
			if(!cursor) return;

			//if the current cursor key is not same as the conversion rate change to next cursor
			if(cursor.key != conv){
				console.log('[cursor] : ', cursor.key)
				console.log('changing cursor to next cursor');
				return cursor.continue().then(changeCursor)
			}

			const e_rate = cursor.value;

			const res = convert(amtConv, e_rate).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

			fromDisp.innerHTML = `${amtConv} ${fromCurrency} =`;

			toDisp.innerHTML = `${res} ${toCurrency}`;
			
			curDisp.innerHTML = `<p>${name_currency_from} <-> ${name_currency_to}</p>`;
			
			rate.innerHTML = `
					<p>1 ${fromCurrency} = ${e_rate} ${toCurrency} <-> 1 ${toCurrency} = ${1 / e_rate} ${fromCurrency}</p>
				   `;

			Disp.style.display = 'block';

		})

	})

});

function convert(amt, cVal){

	return amt * cVal;

}
