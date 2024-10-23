# Forum-de-games

<h2>Para que a aplicação funcione:</h2> 

terá que fazer um banco de dados com o nome de usuarios e uma tabela chamada users dentro dessa tabela deve conter id, nome, email, senha, telefone e se quiser pode adicionar uma role
<br>
(para role funcionar pode-se usar o seguinte comando ALTER TABLE users ADD COLUMN role ENUM('cliente', 'escritor') NOT NULL DEFAULT 'cliente';)


<h2>Aplicações que terá que baixar:</h2>

As aplicações que teram que ser baixadas são:
<br>
<br>
mysql2;
<br>
body-parser;
<br>
ejs;
<br>
express;
<br>
path
<br>
multer
<br>
<br>
Todos sendo baixadas utilizando o node
<br>
<br>
<h2>Caso queira um que o login e o sistema de post precisa-se:</h2>
<h3>Primeiro precisa criar um banco de dados com o nome que quiser(Eu chamei de usuarios) o nome do banco de dados não imrporta muito e sim as tabelas dentro dela</h3>
<br>
<h3>Seram criadas duas tabelas um com o nome de users(Ou qualquer outro nome) onde será armazenado os dados do cliente deve ser criado as seguintes colunas</h3>
<br>
id(com ela sendo chave primária e não se esqueça do auto incremento)
<br>
nome(Varchar 250)
<br>
email (Varchar 250)
<br>
senha(Varchar 250)
<br>
telefone (Varchar 15)
<br>
role(role ENUM('cliente', 'escritor') NOT NULL DEFAULT 'cliente';)
<br>
<br>
<h3>Agora a outra tabela tem o nome de posts e nela contêm as seguintes colunas:</h3>
<br>
id(id INT AUTO_INCREMENT PRIMARY KEY)
<br>
titulo(titulo VARCHAR(255) NOT NULL)
<br>
conteudo(conteudo TEXT NOT NULL)
<br>
