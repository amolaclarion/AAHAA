import { ipcRenderer } from "electron";
import { AuthFlow, AuthStateEmitter } from "./flow";
import { log } from "./logger";

const SIGN_IN = "Sign-In";
const SIGN_OUT = "Sign-Out";
const JWT_TOKEN_KEY = "JWTToken";
const JWT_TOKEN_EXPIRATION_DATE = "JWTTokenExpireDate";
const JWT_TOKEN_EXPIRATION_TIMESTAMP = "JWTTokenExpireTimeStamp";
const storage = require("electron-json-storage");

interface SnackBarOptions {
  message: string;
  timeout?: number;
  actionHandler?: (event: any) => void;
  actionText?: string;
}

interface UserInfo {
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  id: any;
}

export class App {
  private authFlow: AuthFlow = new AuthFlow();
  private userInfo: UserInfo | null = null;
  private emotion: string;

  private handleSignIn = document.querySelector(
    "#handle-sign-in"
  ) as HTMLElement;

  private fetchUserInfo = document.querySelector(
    "#handle-user-info"
  ) as HTMLElement;

  //private mainWindow = document.querySelector("#mainWindow") as HTMLElement;
  //private splashScreen = document.querySelector("#splashScreen") as HTMLElement;
  private userCard = document.querySelector("#user-info") as HTMLElement;

  private userProfileImage = document.querySelector(
    "#user-profile-image"
  ) as HTMLImageElement;

  private userName = document.querySelector("#user-name") as HTMLElement;

  private snackbarContainer: any = document.querySelector(
    "#appauth-snackbar"
  ) as HTMLElement;

  private emo = document.querySelector(".emoji") as HTMLElement;
  private sad = document.querySelector(".sad") as HTMLElement;
  private neutral = document.querySelector(".neutral") as HTMLElement;
  private happy = document.querySelector(".happy") as HTMLElement;
  private angry = document.querySelector(".angry") as HTMLElement;
  private calm = document.querySelector(".calm") as HTMLElement;
  private frustrated = document.querySelector(".frustrated") as HTMLElement;
  private sick = document.querySelector(".sick") as HTMLElement;
  private surprised = document.querySelector(".surprised") as HTMLElement;
  private laughing = document.querySelector(".laughing") as HTMLElement;

  private submit = document.querySelector(".submit") as HTMLElement;

  public authData;

  constructor() {
    //  this.showSplashScreen(true);
    var lStorage = null;
    let that = this;
    storage.get("authData", function (error, data) {
      console.log("==>authData", data);
      if (error) {
        log(error);
        lStorage = null;
      } else {
        lStorage = that.isObjectEmpty(data) ? null : data;
      }
      if (lStorage) {
        // google auth data exist in local storage then
        var jParse = lStorage;
        if (jParse && jParse.refresh_token) {
          var body = {
            grant_type: "refresh_token",
            refresh_token: jParse.refresh_token,
            client_id:
              "92416843926-p2j0m82ftus60c6fo0fv5ohvj5apt1el.apps.googleusercontent.com",
          };
          let request = new Request(
            "https://www.googleapis.com/oauth2/v4/token",
            {
              method: "POST",
              body: JSON.stringify(body),
              cache: "no-cache",
            }
          );
          fetch(request)
            .then((result) => result.json())
            .then((token) => {
              // toke error
              if (token && token.error) {
                that.signOut();
              } else {
                // set auth data to local storage
                that.setAuthToLocalStorage(token);
                // get user info

                that.getUserInfo(token);
              }
            })
            .catch((error) => {
              console.log(error);
              that.signOut();
            });
        } else {
          that.getUserInfo(jParse);
        }
      } else {
        // this.showSplashScreen(false);
        that.initializeUi();
      }
    });
    this.handleSignIn.addEventListener("click", (event) => {
      if (this.handleSignIn.textContent === SIGN_IN) {
        this.signIn();
      } else if (this.handleSignIn.textContent === SIGN_OUT) {
        this.signOut();
      }
      event.preventDefault();
    });

    this.sad.addEventListener("click", (event: any) => {
      let element = event.currentTarget as HTMLInputElement;
      let value = element.value;
      let shand = document.getElementsByClassName("modal") as HTMLCollectionOf<
        HTMLElement
      >;
      shand[0].style.display = "block";

      event.preventDefault();
    });

    this.neutral.addEventListener("click", (event: any) => {
      let element = event.currentTarget as HTMLInputElement;
      let value = element.value;
      let shand = document.getElementsByClassName("modal") as HTMLCollectionOf<
        HTMLElement
      >;
      shand[0].style.display = "block";
      event.preventDefault();
    });

    this.happy.addEventListener("click", (event: any) => {
      let element = event.currentTarget as HTMLInputElement;
      let value = element.value;
      let checked = event.target.checked;
      let shand = document.getElementsByClassName("modal") as HTMLCollectionOf<
        HTMLElement
      >;
      shand[0].style.display = "block";

      event.preventDefault();
    });

    this.angry.addEventListener("click", (event: any) => {
      let element = event.currentTarget as HTMLInputElement;
      let value = element.value;
      let shand = document.getElementsByClassName("modal") as HTMLCollectionOf<
        HTMLElement
      >;
      shand[0].style.display = "block";

      event.preventDefault();
    });

    this.calm.addEventListener("click", (event: any) => {
      let element = event.currentTarget as HTMLInputElement;
      let value = element.value;
      let shand = document.getElementsByClassName("modal") as HTMLCollectionOf<
        HTMLElement
      >;
      shand[0].style.display = "block";

      event.preventDefault();
    });

    this.frustrated.addEventListener("click", (event: any) => {
      let element = event.currentTarget as HTMLInputElement;
      let value = element.value;
      let shand = document.getElementsByClassName("modal") as HTMLCollectionOf<
        HTMLElement
      >;
      shand[0].style.display = "block";

      event.preventDefault();
    });

    this.sick.addEventListener("click", (event: any) => {
      let element = event.currentTarget as HTMLInputElement;
      let value = element.value;
      let shand = document.getElementsByClassName("modal") as HTMLCollectionOf<
        HTMLElement
      >;
      shand[0].style.display = "block";

      event.preventDefault();
    });

    this.surprised.addEventListener("click", (event: any) => {
      let element = event.currentTarget as HTMLInputElement;
      let value = element.value;
      let shand = document.getElementsByClassName("modal") as HTMLCollectionOf<
        HTMLElement
      >;
      shand[0].style.display = "block";

      event.preventDefault();
    });

    document.getElementById("clear-btn").onclick = (e) => {
      let shand = document.getElementsByClassName("modal") as HTMLCollectionOf<
        HTMLElement
      >;
      shand[0].style.display = "none";
      (<HTMLInputElement>document.getElementById("test-field")).value = "";
    };

    // event handler of submit button
    document.getElementById("feedback").onsubmit = (e) => {
      e.preventDefault();
      // TODO: older code remove
      // const temp = (<HTMLInputElement>document.getElementById("test-field"))
      //   .value;
      // const data = {
      //   emailId: this.userInfo.email,
      //   message: temp,
      //   emotion: this.emotion,
      //   fullname: this.userInfo.name,
      // };

      // TODO: older code remove
      // fetch("http://182.74.238.221/Hindex/electron/operations.php", {
      //   method: "POST",
      //   body: JSON.stringify(data),
      // })
      //   .then((res) => {
      //     (<HTMLInputElement>document.getElementById("dis-message")).innerHTML =
      //       "Thank you for your sharing.";
      //     setTimeout(() => {
      //       (<HTMLInputElement>(
      //         document.getElementById("dis-message")
      //       )).innerHTML = "";
      //       ipcRenderer.send("minimizeWindow");
      //     }, 2000);

      //     let shand = document.getElementsByClassName(
      //       "modal"
      //     ) as HTMLCollectionOf<HTMLElement>;
      //     shand[0].style.display = "none";

      //     (<HTMLInputElement>document.getElementById("test-field")).value = "";
      //   })
      //   .catch((error) => {
      //     log(error);
      //   });
      $this.submitUserAction();
    };

    let emotionsArray = ["angry", "disappointed", "meh", "happy", "inLove"];
    const INPUTS = Array.from(document.querySelectorAll("#smileys input"));

    INPUTS.map((el) =>
      el.addEventListener("click", (event) => this.updateValue(event))
    );
    this.fetchUserInfo.addEventListener("click", () => {
      this.getUserInfo(this.authData);
    });

    this.authFlow.authStateEmitter.on(
      AuthStateEmitter.ON_TOKEN_RESPONSE,
      () => {
        this.updateUi();
        //  request app focus
        ipcRenderer.send("app-focus");
      }
    );
    const $this = this;
    ipcRenderer.on("btnclick_task_finished", function (event, param) {
      // store user data to localstorage
      console.log("btnclick_task_finished params", param);
      $this.setAuthToLocalStorage(param);
      $this.authData = param;
      $this.getUserInfo(param);
    });
  }

  submitUserAction(isRefetchNewToken = false) {
    const temp = (<HTMLInputElement>document.getElementById("test-field"))
      .value;
    const data = {
      emailId: this.userInfo.email,
      message: temp,
      emotion: this.emotion,
      fullname: this.userInfo.name,
    };

    this.getSetJWTToken(isRefetchNewToken).then((token) => {
      // token get success response
      // then submit user response
      fetch("http://182.74.238.221/Hindex/electron/protected.php", {
        headers: new Headers({
          "Content-Type": "application/json",
          JWT: `Bearer ${token}`,
        }),
        method: "POST",
        body: JSON.stringify(data),
      })
        .then(
          (res) => {
            // success response
            if (res.ok && res.status === 200) {
              (<HTMLInputElement>(
                document.getElementById("dis-message")
              )).innerHTML = "Thank you for your sharing.";
              setTimeout(() => {
                (<HTMLInputElement>(
                  document.getElementById("dis-message")
                )).innerHTML = "";
                ipcRenderer.send("minimizeWindow");
              }, 2000);

              let shand = document.getElementsByClassName(
                "modal"
              ) as HTMLCollectionOf<HTMLElement>;
              shand[0].style.display = "none";

              (<HTMLInputElement>document.getElementById("test-field")).value =
                "";
            } else {
              // remove token from localstorage
              this.removeLocalStorage(JWT_TOKEN_KEY);
              this.submitUserAction(true);
            }
          },
          (error) => {
            // error response
            log(error);
          }
        )
        .catch((error) => {
          log(error);
        });
    });
  }

  // get google user info
  getUserInfo(data) {
    let request = new Request("https://www.googleapis.com/userinfo/v2/me", {
      headers: new Headers({ Authorization: `Bearer ${data.access_token}` }),
      method: "GET",
      cache: "no-cache",
    });
    fetch(request)
      .then((result) => result.json())
      .then((user) => {
        log("User Info ", user);
        if (user && user.error && user.error.code == 401) {
          this.signOut();
        } else {
          if (user && user.email) {
            const domainName = user.email.split("@")[1];
            if (domainName == "clariontechnologies.co.in") {
              this.userInfo = user;
              this.updateUi();
              // get set JWT token
              // set JWT token
              this.getSetJWTToken(true);
            } else {
              (<HTMLInputElement>(
                document.getElementById("dis-error-message")
              )).innerHTML = "You are not clarion user";
              setTimeout(() => {
                (<HTMLInputElement>(
                  document.getElementById("dis-error-message")
                )).innerHTML = "";
              }, 2000);
              this.signOut();
            }
          }
        }
      })
      .catch((error) => {
        this.signOut();
        log("Something bad happened ", error);
      });
  }

  signIn(username?: string) {
    ipcRenderer.send("btnclick");
  }

  updateValue(e: any) {
    const x = <HTMLInputElement>document.querySelector("#result");
    x.innerHTML = e.target.value;
    this.emotion = e.target.value;
    document.querySelector(".active").classList.remove("active");
    e.target.classList.add("active");
    log("selected smiley", e.target);
  }

  // private showSplashScreen(show) {
  //   if (show) {
  //     this.mainWindow.style.display = "none";
  //    // this.splashScreen.style.display = "block";
  //   } else {
  //     this.mainWindow.style.display = "block";
  //     //this.splashScreen.style.display = "none";
  //   }
  // }
  private initializeUi() {
    this.handleSignIn.textContent = SIGN_IN;
    this.fetchUserInfo.style.display = "none";
    this.userCard.style.display = "none";
  }

  // update ui post logging in.
  private updateUi() {
    //this.showSplashScreen(false);
    this.handleSignIn.textContent = SIGN_OUT;
    this.fetchUserInfo.style.display = "";
    if (this.userInfo) {
      this.userProfileImage.src = `${this.userInfo.picture}?sz=96`;
      this.userName.textContent = this.userInfo.name;
      this.showSnackBar({
        message: `Welcome ${this.userInfo.name}`,
        timeout: 4000,
      });
      this.userCard.style.display = "";
    }
  }

  private showSnackBar(data: SnackBarOptions) {
    this.snackbarContainer.MaterialSnackbar.showSnackbar(data);
  }

  signOut() {
    this.authFlow.signOut();
    this.userInfo = null;
    // this.showSplashScreen(false);
    this.initializeUi();
    let shand = document.getElementsByClassName("modal") as HTMLCollectionOf<
      HTMLElement
    >;
    shand[0].style.display = "none";
    //localStorage.clear();
    storage.clear();
  }

  // set token to local storage and return
  getSetJWTToken(isRefetchNewToken = false): Promise<any> {
    return new Promise((resolve, reject) => {
      // get token from local storage if exist
      let jwtToken = null;
      let that = this;
      storage.get(JWT_TOKEN_KEY, function (error, data) {
        console.log("==>jwtToken", data);
        if (error) {
          log(error);
          jwtToken = null;
        } else {
          jwtToken = that.isObjectEmpty(data) ? null : data;
        }

        // const jwtToken = this.getLocalStorage(JWT_TOKEN_KEY);
        if (!isRefetchNewToken && jwtToken) {
          return resolve(jwtToken);
        } else if (isRefetchNewToken && that.userInfo.email && !jwtToken) {
          // if user exist
          // call API and get token and return it
          let data = { email: that.userInfo.email };
          let request = new Request(
            "http://182.74.238.221/Hindex/electron/getToken.php",
            {
              method: "POST",
              cache: "no-cache",
              body: JSON.stringify(data),
            }
          );

          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                return response.json();
              } else {
                throw new Error("Error in getting the JWT token API response.");
              }
            })
            .then((data) => {
              // store JWT token in local storage
              console.log("===>New JWT Token", data);
              that.setLocalStorage(JWT_TOKEN_KEY, data.jwt);
              that.setLocalStorage(JWT_TOKEN_EXPIRATION_DATE, data.expireDate);
              that.setLocalStorage(
                JWT_TOKEN_EXPIRATION_TIMESTAMP,
                data.expireAt
              );
              return resolve(data.jwt);
            })
            .catch((error) => {
              log("Error in getting the JWT token API response.", error);
              return reject(
                new Error("Error in getting the JWT token API response.")
              );
            });
        } else {
          return reject(new Error("Error in getting the JWT token."));
        }
      });
    });
  }

  private setAuthToLocalStorage(token: any) {
    this.setLocalStorage("authData", token);
  }

  private setLocalStorage(keyName: string, keyValue: any) {
    console.log("====>Setting storage for key", keyName);
    storage.set(keyName, keyValue, function (error) {
      if (error) throw error;
    });
    // localStorage.setItem(keyName, keyValue);
  }

  // private async getLocalStorage(keyName: string): Promise<any> {
  //   const value = await storage.get(keyName, function (error, data) {
  //     if (error) {
  //       console.log("****", error);
  //       return null;
  //     } else {
  //       console.log("*****data", data);
  //       return data;
  //     }
  //   });
  //   return value;
  // }

  private removeLocalStorage(keyName: string) {
    storage.remove(keyName, function (error) {
      if (error) {
        log(error);
      }
    });
  }

  private isObjectEmpty(obj: Object): boolean {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }
}

log("Init complete");
const app = new App();
