import { Injectable } from '@angular/core';
import {Router, CanActivate, ActivatedRoute} from '@angular/router';
import {AuthService} from "../services";
import {environment} from "../../../environments/environment";

@Injectable()
export class SecureAuthGuard implements CanActivate {

  constructor(private router: Router, private authService: AuthService) { }

  canActivate() {
    if (this.authService.isLoggedIn()) {
      // logged in so return true
      return true;
    }

    // not logged in so redirect to login page
    location.href = environment.baseUrl;
    return false;
  }
}
