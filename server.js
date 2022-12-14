const fs = require("fs");
const bodyParser = require("body-parser");
const jsonServer = require("json-server");
const session = require("express-session");

const hasAuth = process.argv[2] !== "noauth";
const server = jsonServer.create();
const router = jsonServer.router("./db.json");
const userDb = JSON.parse(fs.readFileSync("./users.json", "utf-8"));

server.use(jsonServer.defaults());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

server.get("/calendar/:month", (req, res) =>
    res.sendFile(`${__dirname}/public/index.html`),
);

const SECRET_KEY = "123456789";
server.use(
    session({
        secret: SECRET_KEY,
        resave: false,
        saveUninitialized: false,
    }),
);

// Check if the user exists in database
function findUser({ email, password }) {
    return userDb.users.find(
        (user) => user.email === email && user.password === password,
    );
}

server.post("/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = findUser({ email, password });

    if (!user) {
        const status = 401;
        const message = "E-mail ou senha incorretos";
        res.status(status).json({ status, message });
    } else {
        req.session.user = { name: user.name, email: user.email };
        res.status(200).json(req.session.user);
    }
});

server.get("/auth/user", (req, res) => {
    if (req.session.user) {
        res.status(200).json(req.session.user);
    } else {
        res.status(401).json({ status: 401, message: "Não autenticado." });
    }
});

server.post("/auth/logout", (req, res) => {
    if (req.session.user) {
        req.session.destroy((err) =>
            res.status(200).json({ message: "Deslogado" }),
        );
    } else {
        res.status(401).json({ status: 401, message: "Não autenticado" });
    }
});

if (hasAuth) {
    server.use(/^(?!\/auth).*$/, (req, res, next) => {
        if (!req.session.user) {
            const status = 401;
            res.status(status).json({ status, message: "Não autenticado" });
            return;
        } else {
            next();
        }
    });
}

server.use(router);

server.listen(8080, () =>
    console.log(`Servidor inicializado, auth=${hasAuth}`),
);
