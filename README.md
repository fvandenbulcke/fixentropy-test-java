# Java 17 + Maven + Dragee annotations


Ce projet est un squelette Maven configuré pour:
- Java 17
- compileOnly: io.dragee:ddd-annotations
- annotationProcessor: io.dragee:annotation-processor (via maven-compiler-plugin)

Commandes utiles:
- Compiler sans tests: mvn -q -DskipTests package
- Compiler avec tests: mvn -q verify
- Lancer l’app (sans plugin exec, façon simple): java -cp target/classes com.hoppr.app.App

Remarques versions Dragee:
- Ce pom utilise des ranges Maven ([0,)) pour obtenir la dernière version disponible. Si la résolution échoue, remplacez les propriétés dragee.ddd.version et dragee.processor.version par des versions explicites (ex: 1.2.3).
