import {Component, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatPaginator, MatSnackBar, MatSort} from '@angular/material';
import {MatTableDataSource} from '@angular/material/table';
import {ApprovedListsService, PerformanceService, SiteService} from "../../../core/services";
import {APPROVED_LIST_TYPE, APPROVED_LIST_LABELS, IApprovedListItemRead} from "../../../core/models/approvedLists";
import {ConfirmComponent} from "../../../shared/components";
import {HtmlSnackbarComponent} from "../../../shared/components/html-snackbar/html-snackbar.component";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-approved-lists',
  templateUrl: './approved-lists.component.html',
  styleUrls: ['./approved-lists.component.scss']
})

export class ApprovedListsComponent implements OnInit {

  @ViewChild(MatPaginator, {static: true}) approvedListPaginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  typeFilter: APPROVED_LIST_TYPE = APPROVED_LIST_TYPE.OWNER;
  valueFilter: string;
  fields: any;
  isIEorEdge: boolean = this.siteService.isIEorEdge();
  numberOfResults: number = -1;
  loading: boolean = true;
  approvedLists: IApprovedListItemRead[];
  displayedColumns: string[] = ['value', 'type', 'searchable', 'delete'];

  dataSource: MatTableDataSource<IApprovedListItemRead>;

  constructor(private approvedListsService: ApprovedListsService,
              private performanceService: PerformanceService,
              private siteService: SiteService,
              private snackBar: MatSnackBar,
              public dialog: MatDialog,
              private route: ActivatedRoute,
              private router: Router) {
  }

  filterBySearch() {
    this.dataSource.filter = (this.valueFilter || "").trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async ngOnInit() {
    this.performanceService.start();
    if (this.route.snapshot.queryParamMap.get("type")) {
      this.typeFilter = this.route.snapshot.queryParamMap.get("type") as APPROVED_LIST_TYPE;
    }
    this.route.queryParamMap.subscribe(queryParams => {
      if (queryParams.get("type")) {
        if (this.typeFilter !== queryParams.get("type") as APPROVED_LIST_TYPE) {
          this.typeFilter = queryParams.get("type") as APPROVED_LIST_TYPE;
          this.run();
        }
      }
    });

    this.fields = APPROVED_LIST_LABELS;
    this.dataSource = new MatTableDataSource();
    this.dataSource.paginator = this.approvedListPaginator;
    this.dataSource.sort = this.sort;
    this.dataSource.connect().subscribe(d => {
      this.numberOfResults = d.length;
    });

    this.dataSource.sortingDataAccessor = (data, sortHeaderId) => {
      if (typeof data[sortHeaderId] === "string") {
        return data[sortHeaderId].toLocaleLowerCase();
      }
      else {
        return data[sortHeaderId]
      }
    };

    await this.run();

    this.performanceService.fireGoogleAnalytics('Approved Lists');
  }

  async run() {
    this.loading = true;
    this.approvedLists = await this.approvedListsService.searchApproved({
      limit: 10000,
      type: this.typeFilter,
      searchableOnly: false
    });

    this.dataSource.data = this.approvedLists;
    this.filterBySearch();
    this.loading = false;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams:
        {
          type: this.typeFilter
        },
      replaceUrl: true,
    });
  }

  async confirmDelete(item: IApprovedListItemRead) {
    const dialogRef = this.dialog.open(ConfirmComponent, {
      data: {htmlConfirm: `Are you sure you want to delete <b>${this.fields[item.type]} - ${item.value}</b>?`}
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        await this.approvedListsService.deleteApproved(item.type, item.value);
        this.snackBar.openFromComponent(HtmlSnackbarComponent, {
          panelClass: ["snack-bar-success"],
          data: `<b>${this.fields[item.type]} - ${item.value}</b> removed successfully.`,
        });
        const index: number = this.approvedLists.findIndex(d => d === item);
        this.approvedLists.splice(index, 1);
        this.dataSource.data = this.approvedLists;
      }
    });
  }

}
