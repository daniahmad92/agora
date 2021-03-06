import { action, computed, IReactionDisposer, observable, reaction, runInAction } from 'mobx';
import { AGError, bound } from 'agora-rte-sdk';
import { EduUIStoreBase } from './base';
import {
  AGEduErrorCode,
  CloudDriveCourseResource,
  CloudDrivePagingOption,
  CloudDriveResource,
  EduClassroomConfig,
  CloudDriveResourceUploadStatus,
} from 'agora-edu-core';

export enum FileTypeSvgColor {
  ppt = '#F6B081',
  word = '#96CBE1',
  excel = '#A6DDBF',
  pdf = '#A3C3DE',
  video = '#A8ABE9',
  audio = '#6C82D1',
  txt = '#8597FF',
  image = '#95E2E7',
}

export interface UploadItem {
  resourceUuid: string;
  iconType?: string;
  fileName?: string;
  fileSize?: string;
  currentProgress?: number;
  status: CloudDriveResourceUploadStatus;
}

let _lastFetchPersonalResourcesOptions: CloudDrivePagingOption;
export class CloudUIStore extends EduUIStoreBase {
  readonly pageSize: number = 6;

  private _disposers: IReactionDisposer[] = [];

  onInstall() {
    this._disposers.push(
      reaction(
        () => this.personalResourcesList,
        (personalResourcesList) => {
          if (personalResourcesList.length) {
            const hasConverting = personalResourcesList.some(
              (item) =>
                item?.resource instanceof CloudDriveCourseResource &&
                item?.resource?.taskProgress?.status === 'Converting',
            );
            if (hasConverting) {
              this.fetchPersonalResources({
                pageNo: this.currentPersonalResPage,
                pageSize: this.pageSize,
                resourceName: this.searchPersonalResourcesKeyword,
              });
            }
          }
        },
        {
          delay: 1500,
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => this.searchPersonalResourcesKeyword,
        (keyword) => {
          this.fetchPersonalResources({
            pageNo: 1,
            pageSize: this.pageSize,
            resourceName: keyword,
          });
        },
        {
          delay: 500,
        },
      ),
    );
  }

  /**
   * ???????????????????????????
   * @param name
   * @returns
   */
  fileNameToType(name: string): string {
    if (name.match(/ppt|pptx|pptx/i)) {
      return 'ppt';
    }
    if (name.match(/doc|docx/i)) {
      return 'word';
    }
    if (name.match(/xls|xlsx/i)) {
      return 'excel';
    }
    if (name.match(/mp4/i)) {
      return 'video';
    }
    if (name.match(/mp3/i)) {
      return 'audio';
    }
    if (name.match(/gif|png|jpeg|jpg|bmp/i)) {
      return 'image';
    }
    if (name.match(/pdf/i)) {
      return 'pdf';
    }
    if (name.match(/h5/i)) {
      return 'h5';
    }
    return 'unknown';
  }

  /**
   * ???????????????????????????
   * @param fileByteSize
   * @param decimalPoint
   * @returns
   */
  formatFileSize(fileByteSize: number, decimalPoint?: number) {
    const bytes = +fileByteSize;
    if (bytes === 0) return '- -';
    const k = 1000;
    const dm = decimalPoint || 2;
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + units[i];
  }

  /**
   * ????????????????????????
   * @param options
   * @returns
   */
  @bound
  async fetchPersonalResources(options: CloudDrivePagingOption) {
    try {
      const data = await this.classroomStore.cloudDriveStore.fetchPersonalResources(options);
      _lastFetchPersonalResourcesOptions = options;
      this.setPersonalResCurrentPage(options.pageNo);
      return data;
    } catch (e) {
      this.shareUIStore.addGenericErrorDialog(e as AGError);
    }
  }

  /**
   * ???????????????????????????
   * @param file
   * @returns
   */
  @bound
  async uploadPersonalResource(file: File) {
    try {
      const data = await this.classroomStore.cloudDriveStore.uploadPersonalResource(file);
      return data;
    } catch (e) {
      this.shareUIStore.addGenericErrorDialog(e as AGError);
    }
  }

  /**
   * ????????????
   * @param resource
   */
  @bound
  async openResource(resource: CloudDriveResource) {
    try {
      await this.classroomStore.boardStore.openResource(resource);
    } catch (e) {
      const error = e as AGError;
      // this.shareUIStore.addGenericErrorDialog(e as AGError);
      if (error.codeList && error.codeList.length) {
        const code = error.codeList[error.codeList.length - 1];
        if (
          code == AGEduErrorCode.EDU_ERR_CLOUD_RESOURCE_CONVERSION_CONVERTING &&
          _lastFetchPersonalResourcesOptions
        ) {
          this.fetchPersonalResources(_lastFetchPersonalResourcesOptions);
        }
      }
    }
  }

  /**
   * ????????????
   * @returns
   */
  @computed
  get publicResources() {
    const keyword = this.searchPublicResourcesKeyword;
    const list = EduClassroomConfig.shared.courseWareList;
    const map = new Map<string, CloudDriveResource>();
    if (keyword) {
      list
        .filter((item) => item.resourceName.includes(keyword))
        .forEach((item) => {
          map.set(item.resourceUuid, item);
        });
      return map;
    } else {
      list.forEach((item) => {
        map.set(item.resourceUuid, item);
      });
      return map;
    }
  }

  //  ---------  observable ---------------
  @observable
  showUploadModal = false;
  @observable
  showUploadToast = false;
  /**
   * ????????????
   */
  @observable
  uploadState: 'uploading' | 'success' | 'error' | 'idle' = 'idle';
  /**
   * ????????????modal???????????????
   */
  @observable
  showUploadMinimize = false;
  /**
   * ?????????????????????????????????
   */
  @observable
  searchPublicResourcesKeyword = '';

  /**
   * ?????????????????????????????????
   */
  @observable
  searchPersonalResourcesKeyword = '';

  /**
   * ?????????????????????????????????
   */
  @observable
  personalResourcesCheckSet: Set<string> = new Set();

  /**
   * ??????????????????
   */
  @observable
  currentPersonalResPage = 1;

  /**
   * ??????????????????
   */
  @observable
  isPersonalResSelectedAll = false;

  // ------------- computed ---------------
  /**
   * ??????????????????
   */
  @computed
  get personalResources() {
    return this.classroomStore.cloudDriveStore.personalResources;
  }

  /**
   * ?????????????????????
   */
  @computed
  get personalResourcesTotalNum() {
    return this.classroomStore.cloudDriveStore.personalResourcesTotalNum;
  }

  /**
   * ?????????????????????????????????????????????
   * @returns
   */
  @computed
  get personalResourcesList() {
    const { personalResourceUuidByPage } = this.classroomStore.cloudDriveStore;
    const uuids = personalResourceUuidByPage.get(this.currentPersonalResPage) || [];
    const arr = [];
    for (const uuid of uuids) {
      const res = this.personalResources.get(uuid);
      if (res) {
        arr.push({
          resource: res,
          checked: this.isPersonalResSelectedAll || this.personalResourcesCheckSet.has(uuid),
        });
      }
    }
    return arr;
  }

  /**
   * ???????????????????????????
   * @returns
   */
  @computed
  get hasSelectedPersonalRes() {
    if (this.isPersonalResSelectedAll) {
      return true;
    }
    return [...this.personalResources].some(([uuid]: [string, CloudDriveResource]) => {
      return !!this.personalResourcesCheckSet.has(uuid);
    });
  }

  /**
   * ??????????????????
   * @returns
   */
  @computed
  get uploadingProgresses(): UploadItem[] {
    const { uploadProgress } = this.classroomStore.cloudDriveStore;
    const arr = [];
    for (const item of uploadProgress.values()) {
      const { resourceName, size, progress, status, resourceUuid } = item;
      const progressValue = Math.floor(progress * 100);
      arr.push({
        iconType: this.fileNameToType(resourceName),
        fileName: resourceName,
        fileSize: this.formatFileSize(size),
        currentProgress: progressValue,
        resourceUuid,
        status,
      });
    }
    return arr;
  }

  // ------------- action -----------------
  /**
   * ??????????????????
   * @param resourceUuid
   * @param val
   */
  @action
  setPersonalResourceSelected = (resourceUuid: string, val: boolean) => {
    if (val) {
      this.personalResourcesCheckSet.add(resourceUuid);
    } else {
      this.personalResourcesCheckSet.delete(resourceUuid);
    }
    this.isPersonalResSelectedAll =
      this.personalResourcesCheckSet.size === this.personalResources.size;
  };

  /**
   * ??????????????????
   * @param val
   */
  @action
  setAllPersonalResourceSelected = (val: boolean) => {
    const set = new Set<string>();
    if (val) {
      this.personalResources.forEach((item) => {
        set.add(item.resourceUuid);
      });
    }
    this.isPersonalResSelectedAll = val;
    this.personalResourcesCheckSet = set;
  };

  /**
   * ????????????????????????
   * @param num
   */
  @action
  setPersonalResCurrentPage = (num: number) => {
    this.currentPersonalResPage = num;
  };

  /**
   * ??????????????????
   * @param uploadState
   */
  @action
  setUploadState = (uploadState: 'uploading' | 'success' | 'error') => {
    this.uploadState = uploadState;
  };

  @action
  setShowUploadModal = (v: boolean) => {
    this.showUploadModal = v;
  };

  @action
  setShowUploadToast = (v: boolean) => {
    this.showUploadToast = v;
  };

  /**
   * ??????????????????modal?????????
   * @param v
   */
  @action
  setShowUploadMinimize = (v: boolean) => {
    this.showUploadMinimize = v;
  };

  /**
   * ??????????????????
   * @returns
   */
  @action
  removePersonalResources = async (singleFileUuid?: string) => {
    const uuids: string[] = [];
    const { removePersonalResources } = this.classroomStore.cloudDriveStore;
    if (singleFileUuid) {
      // ??????????????????
      uuids.push(singleFileUuid);
    } else {
      if (this.isPersonalResSelectedAll) {
        this.personalResources.forEach((item) => {
          uuids.push(item.resourceUuid);
        });
      } else {
        this.personalResourcesCheckSet.forEach((uuid) => {
          uuids.push(uuid);
        });
      }
    }
    try {
      await removePersonalResources(uuids);
    } catch (e) {
      this.shareUIStore.addGenericErrorDialog(e as AGError);
      return;
    }
    runInAction(() => {
      this.personalResourcesCheckSet = new Set<string>();
      this.isPersonalResSelectedAll = false;
    });
    const { list = [] } =
      (await this.fetchPersonalResources({
        pageNo: this.currentPersonalResPage,
        pageSize: this.pageSize,
        resourceName: this.searchPersonalResourcesKeyword,
      })) || {};
    if (!list.length && this.currentPersonalResPage > 1) {
      this.setPersonalResCurrentPage(this.currentPersonalResPage - 1);
    }
  };

  /**
   * ?????????????????????????????????
   * @param keyword
   */
  @action.bound
  setSearchPublicResourcesKeyword(keyword: string) {
    this.searchPublicResourcesKeyword = keyword;
  }

  /**
   * ?????????????????????????????????
   * @param keyword
   */
  @action.bound
  setSearchPersonalResourcesKeyword(keyword: string) {
    this.searchPersonalResourcesKeyword = keyword;
  }

  onDestroy() {
    this._disposers.forEach((d) => d());
    this._disposers = [];
  }
}
