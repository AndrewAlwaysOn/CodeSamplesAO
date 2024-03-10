/*
This is a code sample extract from the Foot Strike Trainer. 
FST is a tool for walking & running analysis and training.
One of the modules is used to process the collected data frames to classify the steps.
This is a heuristic algorithm designed to perform on mobile devices. On these devices the frames per second frequency is limited to 17-19fps, so the algorithm performs best capturing the feet position in ther maximum when running in the direction to the right or minimum when running in the direction to the left.
The user is captured from the side view and the algorithm only takes to the account the leg that it can see better: right for right direction and left for left direction.
It is designed to recognize patterns for healthy individuals (not for physically impared or irregular running patterns) walking at about 110steps per minute or running at about 160-180 steps per minute.
On input it receives frs - frames that have been processed with TensorFlow BlazePose model. 
The frames contain human poses collected during the training. 
During the training algorithms were providing real time calculations and biofeedback. Due to the nature of real time, especially an expectation to provide results every 50ms the calculations there are simplified.
The processTrainingFrames is reanalazying all the frames to provide higher quality results after all the data has been collected and now the training results can be calculated, displayed to the user and stored in the database.
*/


function processTrainingFrames(frs) {
	//post training data array 1, contains the indexes of the step moment identified within frs
	let postTres = [];
	//post training data array 2, containing the final results of all measures and stats
	let postTres2 = [];
	//using maxX to determine the maximum position of the toes
	let maxXx = 0;
	for(let i=0; i<frs.length; i++){		
		//having collected data frames frs, identify whether the direction of running
		if(frs[i][0].pose.keypoints[0].x > frs[i][0].pose.keypoints[7].x && frs[i][0].pose.keypoints[0].x > frs[i][0].pose.keypoints[8].x) {
			//running to the right side
			lmd=1;
		} else if(frs[i][0].pose.keypoints[0].x < frs[i][0].pose.keypoints[7].x && frs[i][0].pose.keypoints[0].x < frs[i][0].pose.keypoints[8].x){
			//running to the left side then we search for a minimum, initialize maxXx accordingly
			lmd=-1;
			if ( maxXx == 0 ) maxXx=10000;
		}
		//active search
		if( lmd == 1 ) { 
			if(maxXx < frs[i][0].pose.keypoints[32].x) maxXx = frs[i][0].pose.keypoints[32].x;
		}
		else if( lmd == -1 ) { 
			if(maxXx > frs[i][0].pose.keypoints[31].x) maxXx = frs[i][0].pose.keypoints[31].x;
		}
	}
	//maxXx calculated, process the training frames, divide them into step frames
	postTres  = postTraining1(maxXx); 
	if(debugmode) console.log(postTres);
	//process step frames and classify each step accordingly
	postTres2 = postTraining2();
	if(debugmode) console.log(postTres2);
	
	//prepare results for display, summarize them in ftres
	ftres.fttst = postTres2.S;
	if(lmd == 1) ftres.fttkna = Math.round(postTres2.lkr);
	if(lmd == -1) ftres.fttkna = Math.round(postTres2.lkl);
	
	//calculate steps per minute
	ftres.fttsma = Math.round(postTres2.S * 2 * (60/as)); 
	
	ftres.fttvda = Math.round(postTres2.vd);
	ftres.fttuba = Math.round(postTres2.uba);
	ftres.ftthe = postTres2.H;
	ftres.fttfo = postTres2.F;
	ftres.fttmi = postTres2.M;
	ftres.fttst = postTres2.S;
	ftres.ftthha = postTres2.hh;
	ftres.ftthkha = postTres2.hkh;

}

/*
postTraining1:
1- Calculates and returns the localMaximaIndexes - identifies the moment of step for:
a) running to the left (acts as minima)
b) running to the right (maxima)
*/
function postTraining1(max) {
	//max is used to determine the maximum/minimum of the position of the step
    const maxX = max;
	
	//for the analysis we will only accepts steps that were in the acceptable range
    let halfMaxX = maxX *0.6;

	//the results of this function will be an array of indexes / moments of step
    let localMaximaIndexes = [];
	
	//some local variables for calculations
    let inRange = false;
    //current index for calculations
	let currentRangeMaxIndex = -1;
    //we will search for a max so we need a starting min for calculations
	let currentRangeMaxValue = -10000;
	//we will search for a min so we need a starting max for calculations
	let currentRangeMinValue = 10000;
	//temp max/min will be stored in:
	let X = 0;
	//movement direction will be recalculated to make sure we are searching for the right thing
    let lmd = 0;
	//we will use amode once decided on the mode
	let amode;
	
	
	for (let i = 0; i < frs.length; i++) {
		if(frs[i][0].pose.keypoints[0].x > frs[i][0].pose.keypoints[7].x && frs[i][0].pose.keypoints[0].x > frs[i][0].pose.keypoints[8].x) {
			lmd=1;
		}else if(frs[i][0].pose.keypoints[0].x < frs[i][0].pose.keypoints[7].x && frs[i][0].pose.keypoints[0].x < frs[i][0].pose.keypoints[8].x) {
			if (debugmode) console.log('left direction currentRangeMinValue ='+currentRangeMinValue );
			lmd=-1;
			//since we are searching for a minimum in this case then halfMaxX must be bigger then max  
			halfMaxX = 2 * max;
		}
		//add the directional data to the frames
		frs[i].push({lmdv: lmd});
		//depending on the direction we will calculate either the left or right leg movement
		if(lmd == 1) {
			X = frs[i][0].pose.keypoints[32].x; 
			amode="max";
		}
		if(lmd == -1) {
			X = frs[i][0].pose.keypoints[31].x; 
			amode="min";
		}
		//let's calculate the upper body lean - defined us upper body lean (shoulder position vs hip position)
		let ubl2 = 0;
		if(lmd == 1){
			//cABV calculates the angle between two vectors
			ubl2 = cABV(frs.length,  
						 (frs[i][0].pose.keypoints[23].x+frs[i][0].pose.keypoints[24].x)/2,
						 (frs[i][0].pose.keypoints[23].y+frs[i][0].pose.keypoints[24].y)/2,
						 (frs[i][0].pose.keypoints[11].x+frs[i][0].pose.keypoints[12].x)/2, 
						 (frs[i][0].pose.keypoints[11].y+frs[i][0].pose.keypoints[12].y)/2,  
						 (frs[i][0].pose.keypoints[11].x+frs[i][0].pose.keypoints[12].x)/2, 
						 (frs[i][0].pose.keypoints[11].y+frs[i][0].pose.keypoints[12].y)/4, 
						 (frs[i][0].pose.keypoints[11].x+frs[i][0].pose.keypoints[12].x)/2, 
						 (frs[i][0].pose.keypoints[11].y+frs[i][0].pose.keypoints[12].y)/2);
		}else if(lmd == -1){
			ubl2 = -1 * cABV(frs.length,  
						 (frs[i][0].pose.keypoints[23].x+frs[i][0].pose.keypoints[24].x)/2,
						 (frs[i][0].pose.keypoints[23].y+frs[i][0].pose.keypoints[24].y)/2,
						 (frs[i][0].pose.keypoints[11].x+frs[i][0].pose.keypoints[12].x)/2, 
						 (frs[i][0].pose.keypoints[11].y+frs[i][0].pose.keypoints[12].y)/2,  
						 (frs[i][0].pose.keypoints[11].x+frs[i][0].pose.keypoints[12].x)/2, 
						 (frs[i][0].pose.keypoints[11].y+frs[i][0].pose.keypoints[12].y)/4, 
						 (frs[i][0].pose.keypoints[11].x+frs[i][0].pose.keypoints[12].x)/2, 
						 (frs[i][0].pose.keypoints[11].y+frs[i][0].pose.keypoints[12].y)/2);			
		}
		//add the upper body lean data to the frames
		frs[i].push({ublv: ubl2});
		
		//let's calculate the knee lift for the left leg
		let lkl = 0;
		if(lmd == 1){
			//cABV calculates the angle between two vectors
			lkl = cABV(frs.length, frs[i][0].pose.keypoints[23].x, 
				 frs[i][0].pose.keypoints[23].y, 
				 frs[i][0].pose.keypoints[23].x, 
				 frs[i][0].pose.keypoints[23].y/2, 
				 frs[i][0].pose.keypoints[23].x, 
				 frs[i][0].pose.keypoints[23].y,
				 frs[i][0].pose.keypoints[25].x, 
				 frs[i][0].pose.keypoints[25].y);
		} else {
			lkl = 180-cABV(frs.length, frs[i][0].pose.keypoints[25].x, 
				 frs[i][0].pose.keypoints[25].y, 
				 frs[i][0].pose.keypoints[23].x, 
				 frs[i][0].pose.keypoints[23].y, 
				 frs[i][0].pose.keypoints[23].x, 
				 frs[i][0].pose.keypoints[23].y,
				 frs[i][0].pose.keypoints[23].x, 
				 frs[i][0].pose.keypoints[23].y/2);
			if (lkl > 120) lkl = 0;
		}
		//let's calculate the knee lift for the right leg
		let lkr = 0;
		if(lmd == 1){
			lkr = cABV(frs.length,	 frs[i][0].pose.keypoints[24].x, 
							 frs[i][0].pose.keypoints[24].y,
							 frs[i][0].pose.keypoints[24].x, 
							 frs[i][0].pose.keypoints[24].y/2, 
							 frs[i][0].pose.keypoints[24].x, 
							 frs[i][0].pose.keypoints[24].y, 
							 frs[i][0].pose.keypoints[26].x, 
							 frs[i][0].pose.keypoints[26].y);
		} else {
			lkr = 180-cABV(frs.length,	 frs[i][0].pose.keypoints[26].x, 
							 frs[i][0].pose.keypoints[26].y,
							 frs[i][0].pose.keypoints[24].x, 
							 frs[i][0].pose.keypoints[24].y, 
							 frs[i][0].pose.keypoints[24].x, 
							 frs[i][0].pose.keypoints[24].y, 
							 frs[i][0].pose.keypoints[24].x, 
							 frs[i][0].pose.keypoints[24].y/2);
			if (lkr > 120) lkr = 0;	
		}
		
		//add the knee lift data to the frames
		frs[i].push({lklv: lkl});
		frs[i].push({lkrv: lkr});
		
		//provide data for vertical displacement calculation ~ (max hip Y position - min hip Y position for a step frames set)
		let vdc = 0;
		if(lmd == 1) {
			vdc = frs[i][0].pose.keypoints[24].y;
		}else if(lmd == -1) {
			vdc = frs[i][0].pose.keypoints[23].y;
		}
		//add data for vertical displacement calculation to the frames
		frs[i].push({vdcv: vdc});
		
		//add step data to the frames Left vs Right leg being monitored
		let st = "";
		if(lmd == 1){
			if (frs[i][0].pose.keypoints[25].x > frs[i][0].pose.keypoints[26].x + 20) st="L";
			if (frs[i][0].pose.keypoints[26].x > frs[i][0].pose.keypoints[25].x + 20) st="R";
		}
		if(lmd == -1){
			if (frs[i][0].pose.keypoints[25].x -20 < frs[i][0].pose.keypoints[26].x) st="L";
			if (frs[i][0].pose.keypoints[26].x -20 < frs[i][0].pose.keypoints[25].x) st="R";
		}
		frs[i].push({stv: st});
		
		//calculate hip knee heel angle in the estimated moment of step
		let hkh = 0;
		
		//calculate hip heel distance in the estimated moment of step
		let hh = 0;
		
		if(lmd == 1){
			hkh = cABV(frs.length,  
					 frs[i][0].pose.keypoints[24].x,
					 frs[i][0].pose.keypoints[24].y,
					 frs[i][0].pose.keypoints[26].x, 
					 frs[i][0].pose.keypoints[26].y,  
					 frs[i][0].pose.keypoints[26].x, 
					 frs[i][0].pose.keypoints[26].y, 
					 frs[i][0].pose.keypoints[30].x, 
					 frs[i][0].pose.keypoints[30].y);
			//pszs has been established in calibration, it's used to convert pixels into centimeters and is being established during calibration phase where user is standing straight and his height is being input via an input form in cm
			hh = Math.abs(frs[i][0].pose.keypoints[30].x - frs[i][0].pose.keypoints[24].x)*pszs;
			if (hkh < 0) hkh=-1 * hkh;
		}else if(lmd == -1){
			hkh = cABV(frs.length,  
					 frs[i][0].pose.keypoints[23].x,
					 frs[i][0].pose.keypoints[23].y,
					 frs[i][0].pose.keypoints[25].x, 
					 frs[i][0].pose.keypoints[25].y,  
					 frs[i][0].pose.keypoints[25].x, 
					 frs[i][0].pose.keypoints[25].y, 
					 frs[i][0].pose.keypoints[29].x, 
					 frs[i][0].pose.keypoints[29].y);
			hh = Math.abs(frs[i][0].pose.keypoints[31].x - frs[i][0].pose.keypoints[25].x)*pszs;
			if (hkh < 0) hkh=-1 * hkh;
		}
		//add data to the frames
		frs[i].push({hkhv: hkh});
		frs[i].push({hhv: hh});
		
		//calculate maximum depending on the mode
		if(amode === "max"){
			if (X > halfMaxX) {
				console.log('Start or continue a range');
				inRange = true;
				if (X > currentRangeMaxValue) {
					console.log('New maximum within the current range');
					currentRangeMaxIndex = i;
					currentRangeMaxValue = frs[i][0].pose.keypoints[32].x;
				}
			} else if (inRange) {
				console.log(' End of the range, selected: '+currentRangeMaxIndex);
				inRange = false;
				if (currentRangeMaxIndex !== -1) {
					localMaximaIndexes.push(currentRangeMaxIndex);
					currentRangeMaxIndex = -1;
					currentRangeMaxValue = -10000;
				}
			}
		}
		else if(amode === "min"){//calculate minimum depending on the mode
			
			if (X < halfMaxX) {
				console.log(' Start or continue a min range '+i);
				inRange = true;
				if (X < currentRangeMinValue ) {
					console.log(' New minimum '+X+' within the current range '+i);
					currentRangeMaxIndex  = i;
					currentRangeMinValue  = frs[i][0].pose.keypoints[31].x;
				}
			} else if (inRange) {
				console.log('End of the range, selected '+currentRangeMaxIndex);
				inRange = false;
				if (currentRangeMaxIndex !== -1) {
					localMaximaIndexes.push(currentRangeMaxIndex);
					currentRangeMaxIndex = -1;
					currentRangeMinValue  = 10000;
				}
			}
		}
    }
	//for the last frames take them into account only if the foot placement is in the proper area, otherwise it may result in a fake step
    if (currentRangeMaxIndex !== -1 && currentRangeMaxValue > 0.9*max) {
        localMaximaIndexes.push(currentRangeMaxIndex);
    }

	//exclude the fake steps that have resulted from corrupted TensorFlow data 
	for (let i=0; i<localMaximaIndexes.length; i++) {
		if (frs[localMaximaIndexes[i]][6].stv === "") localMaximaIndexes.splice(i, 1);
	}
	//exclude the fake steps that have resulted from corrupted TensorFlow data which sometimes takes left as right leg and the opposite. so standarize the steps frequency and search for steps in the right moments
	let keyDist = 0;
	for (let i=1; i<localMaximaIndexes.length; i++) {
		keyDist += localMaximaIndexes[i]-localMaximaIndexes[i-1];	
	}	
	keyDist = keyDist/(localMaximaIndexes.length-1)*0.8;
	if(debugmode) console.log("keyDist:"+keyDist);
	for (let i=1; i<localMaximaIndexes.length; i++) {
		if(lmd == 1) {
			X = frs[localMaximaIndexes[i]][0].pose.keypoints[32].x; 
			X1 = frs[localMaximaIndexes[i-1]][0].pose.keypoints[32].x;
		}
		else if(lmd == -1) {
			X = frs[localMaximaIndexes[i]][0].pose.keypoints[31].x; 
			X1 = frs[localMaximaIndexes[i-1]][0].pose.keypoints[31].x;
		}
		//process the steps that occured in the proper timing // excludes fake steps from corrupted data // choose the most eXtreme step (min or max)
		if(localMaximaIndexes[i]-localMaximaIndexes[i-1]<keyDist){
			if(amode === "max"){
				if(X > X1){				
					if(debugmode) console.log("postTraining1 removed index "+(i-1)+" frameno:"+localMaximaIndexes[i-1]);
					localMaximaIndexes.splice(i-1, 1);
				}else if(X < X1){				
					if(debugmode) console.log("postTraining1 removed index "+i+" frameno:"+localMaximaIndexes[i]);
					localMaximaIndexes.splice(i, 1);
				}
			}
			if(amode === "min"){
				if(X < X1){				
					if(debugmode) console.log("postTraining1 removed index "+(i-1)+" frameno:"+localMaximaIndexes[i-1]);
					localMaximaIndexes.splice(i-1, 1);
				}else if(X > X1){				
					if(debugmode) console.log("postTraining1 removed index "+i+" frameno:"+localMaximaIndexes[i]);
					localMaximaIndexes.splice(i, 1);
				}
			}
		}		
	}
	//redo check on key distribution but this time check within neighbouring three steps
	for (let i=1; i<localMaximaIndexes.length-1; i++) {
		if(lmd == 1) {
			X = frs[localMaximaIndexes[i]][0].pose.keypoints[32].x; 
			X1 = frs[localMaximaIndexes[i-1]][0].pose.keypoints[31].x;
			X2 = frs[localMaximaIndexes[i+1]][0].pose.keypoints[31].x;
		}
		if(lmd == -1) {
			X = frs[localMaximaIndexes[i]][0].pose.keypoints[31].x; 
			X1 = frs[localMaximaIndexes[i-1]][0].pose.keypoints[32].x;
			X2 = frs[localMaximaIndexes[i+1]][0].pose.keypoints[32].x;
		}		
		if(localMaximaIndexes[i]-localMaximaIndexes[i-1]<keyDist && localMaximaIndexes[i+1]-localMaximaIndexes[i]<keyDist){
			localMaximaIndexes.splice(i, 1);
			if(debugmode) console.log("fine tuning postraining removed index "+i+" frameno:"+localMaximaIndexes[i]);			
		} else if((X>X2 && X<X1) || (X<X2 && X>X1)){
				localMaximaIndexes.splice(i, 1);
				if(debugmode) console.log("fine tuning 2 postraining removed index "+i+" frameno:"+localMaximaIndexes[i]);			
		}
	}

    return localMaximaIndexes;
}

/*
Having cleaned up and pre calculated the data in postTraining1 and identified key step frames we can perform the final analysis on the training data.

*/
function postTraining2() {        
	
	let ii = 0;
    let ubm = 0;
	let ubx = 0;    
	let lklx = 0;    
	let lkrx = 0;  
	let vdm = 2000;
	let vdx = 0;
	let res = {
		uba: 0, //will be calculated as avg from all
		lkl: 0, //will be calculated as max avg from all
		lkr: 0, //will be calculated as max avg from all
		vd: 0, //will be calculated as avg from (max - min) within step frames
		F:0, //forefoot strike
		M:0, //midfoot strike
		H:0, //heel strike
		S:0, //steps count
		spm:0, //steps per minute
		hh:0, //hip heel distance in the moment of step
		hkh:0} //hip heel knee angle in the moment of step
	
	for (let i = 0; i < frs.length; i++) {
			
		res.uba += frs[i][5].ublv;
		let lkl = frs[i][6].lklv;
		let lkr = frs[i][7].lkrv;
		let vd = frs[i][8].vdcv;  
		
		// find max and min vd in movement segment
		if (vd < vdm) vdm = vd;
		if (vd > vdx) vdx = vd;        
		
		// find max lkl and lkr in current frame segment
		if (lkl > lklx) lklx = lkl;        
		if (lkr > lkrx) lkrx = lkr;
		
		if( i == frs.length-1 || i == postTres[ii]){ // if segment ends then perform calculations for a given step
			//collect calculations for current step segment
			if ( debugmode ) console.log("adding vdm:"+(vdx-vdm));
			if ( vdx-vdm>0 ) res.vd += vdx-vdm;
			res.lkl += lklx;
			res.lkr += lkrx;   
			lklx = 0;    
			lkrx = 0;  
			vdm = 2000;
			vdx = 0;
			ii++; //move to the next segment
		}	              
		
    }
	//Finalize calculations / summarize results to prepare for displaying
	res.uba = res.uba/frs.length;
	if ( debugmode ) console.log("adding vdm:"+(vdx-vdm));
	if(vdx-vdm>0) {
		res.vd += vdx-vdm;
		res.vd = res.vd/postTres.length * pszs;
	}else{
		res.vd = res.vd/(postTres.length-1) * pszs;
	}
	res.lkl += lklx;
	res.lkr += lkrx;
	res.lkl = res.lkl / postTres.length;
	res.lkr = res.lkr / postTres.length;

	let hh=0;
	let hkh=0;
	for (let i = 0; i < postTres.length; i++) {
		hkh += frs[postTres[i]][10].hkhv; 
		hh += frs[postTres[i]][11].hhv; 
		let st = frs[postTres[i]][9].stv; 	
		if ( debugmode ) console.log(i+" "+st);
		if(st === "R"){
			let y = (frs[postTres[i]][0].pose.keypoints[30].y - frs[postTres[i]][0].pose.keypoints[32].y);
			if ( debugmode ) console.log(y);
			if( y < (-1)*stTol) {
				res.F++;
			} else {			
				if( y > stTol ) {
					res.H++;
				} else {
					res.M++;
				}
			}			
		}
		if(st === "L"){
			let y = (frs[postTres[i]][0].pose.keypoints[29].y - frs[postTres[i]][0].pose.keypoints[31].y);
			if ( debugmode ) console.log(y);
			if( y < (-1)*stTol) {
				res.F++;
			} else {			
				if( y > stTol ) {
					res.H++;
				} else {
					res.M++;
				}
			}			
		}
		
	}
	res.hkh = Math.round( hkh / postTres.length); 
	res.hh = Math.round( hh / postTres.length); 
	res.S = postTres.length;
	res.spm = postTres.length;
    return res;
}