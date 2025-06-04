import { Injectable } from '@angular/core';
import { CdkDropList } from '@angular/cdk/drag-drop';

@Injectable({
	providedIn: 'root'
})
export class TaskbarService {
	private _dropList?: CdkDropList;

	setDropList(dropList: CdkDropList) {
		this._dropList = dropList;
	}

	getDropList(): CdkDropList | undefined {
		return this._dropList;
	}
} 