// src/pages/index.tsx
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { sendNotification } from "@tauri-apps/api/notification";
import {
  createDir,
  BaseDirectory,
  // readDir,
  writeTextFile,
  // readTextFile,
} from "@tauri-apps/api/fs";

import { ask } from "@tauri-apps/api/dialog";

const buttons = [
  {
    value: 900,
    display: "15 minutes",
  },
  {
    value: 1800,
    display: "30 minutes",
  },
  {
    value: 3600,
    display: "60 minutes",
  },
];

const INITIAL_CUSTOM_TIMER = {
  value: 2,
  display: "2 minutes",
};

const INITIAL_NOTE = () => {
  return {
    id: nanoid(),
    body: "",
  };
};

function App() {
  const [time, setTime] = useState(buttons[0].value);
  const [note, setNote] = useState(INITIAL_NOTE());
  const [timerStart, setTimerStart] = useState(false);
  const [custom, setCustom] = useState(INITIAL_CUSTOM_TIMER);

  const toggleStart = async () => {
    if (note.body) {
      await writeNoteBodyToFile(note.id, `${time / 60}\n` + note.body);
    }
    setTimerStart(true);
  };

  const toggleEnd = () => {
    setTimerStart(false);
  };

  const customTimerTrigger = async () => {
    let shouldSetCustomTimer = await ask(
      `Set timer for ${custom.value === 1 ? "1 minute" : custom.display}?`,
      {
        title: "Custom Timer",
        type: "info",
      }
    );

    if (shouldSetCustomTimer) {
      setTime(custom.value * 60);
    }
  };

  const triggerResetDialog = async () => {
    let shouldReset = await ask("Do you want to reset timer?", {
      title: "Busse Pomodoro Timer App",
      type: "warning",
    });

    if (shouldReset) {
      setTime(buttons[0].value);
      toggleEnd();
      setCustom(INITIAL_CUSTOM_TIMER);
      setNote(INITIAL_NOTE());
    }
  };

  const writeNoteBodyToFile = async (id: string, body: string) => {
    await writeTextFile(`users\\${id}.txt`, body, {
      dir: BaseDirectory.App,
    });
  };

  const handleNotesChange = async (e) => {
    setNote((prev) => {
      return {
        ...prev,
        body: e.target.value,
      };
    });
  };

  useEffect(() => {
    (async () => {
      await createDir("users", { dir: BaseDirectory.App, recursive: true });
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timerStart) {
        if (time > 0) {
          setTime(time - 1);
        } else if (time === 0) {
          sendNotification({
            title: "Busse Pomodoro Timer App",
            body: `
🎉 ${note.id} 🎉

${note.body}

`,
          });

          setTimerStart(false);
          setTime(buttons[0].value);

          clearInterval(interval);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStart, time]);

  return (
    <Box h="100vh" w="100vw">
      <Flex
        background="gray.700"
        height="100%"
        alignItems="center"
        flexDirection="column"
        flexGrow={1}
      >
        <Box>
          <Box marginTop="10">
            <Text color="white" fontWeight="light" fontSize="22" as="u">
              Busse Pomodoro Timer
            </Text>
          </Box>

          <Text
            fontWeight="bold"
            fontSize="7xl"
            color="white"
            marginTop="10"
            marginBottom="5"
          >
            {`${
              Math.floor(time / 60) < 10
                ? `0${Math.floor(time / 60)}`
                : `${Math.floor(time / 60)}`
            }:${time % 60 < 10 ? `0${time % 60}` : time % 60}`}
          </Text>
        </Box>

        <Flex flexDirection="row" justifyContent="space-between">
          <ButtonGroup gap="2">
            <Button
              width="7rem"
              background="yellow.500"
              fontWeight="bold"
              color="white"
              onClick={() => {
                !timerStart ? toggleStart() : toggleEnd();
              }}
            >
              {!timerStart ? "Start" : "Pause"}
            </Button>
            {(timerStart || time) && (
              <Button
                width="7rem"
                background="tomato"
                fontWeight="bold"
                color="white"
                onClick={triggerResetDialog}
                disabled={timerStart}
              >
                Reset
              </Button>
            )}
          </ButtonGroup>
        </Flex>

        <Flex flex={1} />

        <Flex
          flexDir="column"
          w="75%"
          maxW="100%"
          bg="white"
          rounded="md"
          justifyContent="space-between"
        >
          <Textarea
            placeholder="notes..."
            value={note.body}
            onChange={handleNotesChange}
          />
        </Flex>

        <Flex marginY={10}>
          <Flex flexDir="column" gap={2}>
            <NumberInput
              bg="white"
              defaultValue={1}
              rounded="md"
              maxW="75%"
              marginX="auto"
              value={custom.value}
              onChange={(valueString) => {
                setCustom({
                  value: parseInt(valueString),
                  display:
                    valueString === "1" ? "1 minute" : `${valueString} minutes`,
                });
              }}
              min={1}
              max={120}
              step={1}
              keepWithinRange={true}
              clampValueOnBlur={false}
              allowMouseWheel
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>

            <Button
              marginX="auto"
              maxW="75%"
              background="blue.300"
              color="white"
              onClick={customTimerTrigger}
            >
              {custom.display}
            </Button>
          </Flex>
          {buttons.map(({ value, display }) => (
            <Button
              marginX={4}
              background="green.300"
              color="white"
              onClick={() => {
                setTimerStart(false);
                setTime(value);
              }}
            >
              {display}
            </Button>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}
export default App;
